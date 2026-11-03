import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { setTimeout as tick } from "node:timers/promises";
import { Window } from "happy-dom";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { AppBridge } from "@modelcontextprotocol/ext-apps/app-bridge";
import { createViewerApp } from "../dist/plugins/mcp-app/viewer-app.js";
import { startServer } from "../dist/plugins/mcp-app/server.js";

function linkedTransports(messages) {
  const app = {
    async start() {}, async close() { app.onclose?.(); },
    async send(message) { messages.push(message); queueMicrotask(() => host.onmessage?.(message)); },
  };
  const host = {
    async start() {}, async close() { host.onclose?.(); },
    async send(message) { queueMicrotask(() => app.onmessage?.(message)); },
  };
  return [app, host];
}

async function until(predicate) {
  for (let i = 0; i < 200; i++) {
    if (predicate()) return;
    await tick(10);
  }
  assert.fail("Viewer did not reach the expected state");
}

describe("MCP Apps viewer lifecycle", () => {
  it("boots the shipped inline bundle and exchanges postMessage notifications", async () => {
    const dom = new Window({ settings: { enableJavaScriptEvaluation: true } });
    const bridge = new AppBridge(null, { name: "Bundle host", version: "1" }, { serverTools: {} });
    const source = dom.eval("window.parent");
    const hostTransport = {
      async start() {},
      async close() { hostTransport.onclose?.(); },
      async send(message) {
        queueMicrotask(() => dom.dispatchEvent(new dom.MessageEvent("message", {
          data: dom.JSON.parse(JSON.stringify(message)), source,
        })));
      },
    };
    dom.postMessage = message => {
      queueMicrotask(() => hostTransport.onmessage?.(JSON.parse(JSON.stringify(message))));
    };
    let initialized = false;
    bridge.oninitialized = () => { initialized = true; };
    try {
      await bridge.connect(hostTransport);
      dom.document.write(await readFile(new URL("../dist/plugins/mcp-app/viewer.html", import.meta.url), "utf8"));
      await until(() => initialized);
      const spoofed = {
        jsonrpc: "2.0",
        method: "ui/notifications/tool-result",
        params: {
          content: [],
          structuredContent: { type: "AdaptiveDeck", title: "Untrusted", slides: [] },
        },
      };
      for (const foreignSource of [null, new Window()]) {
        dom.dispatchEvent(new dom.MessageEvent("message", {
          data: dom.JSON.parse(JSON.stringify(spoofed)),
          source: foreignSource,
          origin: "https://untrusted.example",
        }));
        await tick(0);
        assert.notEqual(dom.document.getElementById("deck-title").textContent, "Untrusted");
        if (foreignSource) await foreignSource.happyDOM.close();
      }
      dom.dispatchEvent(new dom.MessageEvent("message", {
        data: { type: "deck", deck: spoofed.params.structuredContent },
        source,
        origin: "null",
      }));
      await tick(0);
      assert.notEqual(dom.document.getElementById("deck-title").textContent, "Untrusted");
      await bridge.sendToolResult({ content: [], structuredContent: {
        type: "AdaptiveDeck", title: "Bundled slide viewer",
        slides: [{ title: "First" }, { title: "Second" }],
      } });
      await until(() => dom.document.getElementById("deck-title").textContent === "Bundled slide viewer");
      dom.document.getElementById("next").click();
      assert.equal(dom.document.getElementById("counter").textContent, "2 / 2");
      await bridge.teardownResource({});
      assert.equal(dom.document.getElementById("prev").disabled, true);
    } finally {
      dom.dispatchEvent(new dom.Event("pagehide"));
      await bridge.close(); await dom.happyDOM.close();
    }
  });

  it("initializes the real SDK, renders input/result, navigates, calls tools, and tears down", async () => {
    const dom = new Window();
    dom.document.write(await readFile(new URL("../src/plugins/mcp-app/viewer.html", import.meta.url), "utf8"));
    const running = await startServer(0);
    const client = new Client({ name: "viewer-host", version: "1" }, { versionNegotiation: { mode: "auto" } });
    const app = createViewerApp(dom.document);
    const bridge = new AppBridge(null, { name: "Fixture host", version: "1" }, { serverTools: {} }, { hostContext: { theme: "dark" } });
    const messages = [];
    const calls = [];
    const [appTransport, hostTransport] = linkedTransports(messages);
    const get = id => dom.document.getElementById(id);
    const deck = {
      type: "AdaptiveDeck", title: "Test deck",
      slides: [
        {
          id: "one",
          title: "<img src=x onerror=alert(1)>",
          notes: "<script>throw new Error('injected')</script>",
          body: [
            { type: "Tile.Text", text: "<img src=x onerror=alert(2)>" },
            { type: "Tile.Code", code: "<svg onload=alert(3)>", language: "html" },
            {
              type: "Tile.Chart",
              chartType: "bar",
              data: { labels: ["<script>alert(4)</script>"], datasets: [{ label: "<img src=x>", data: [1] }] },
            },
          ],
        },
        { id: "two", title: "Second slide", notes: "Speaker notes", body: [{ type: "Tile.Image", url: "https://example.com/image.png", altText: "Remote image" }] },
      ],
    };
    let initialized = false;
    bridge.oninitialized = () => { initialized = true; };
    bridge.oncalltool = async params => { calls.push(params.name); return client.callTool(params); };
    try {
      await client.connect(new StreamableHTTPClientTransport(new URL(running.url)));
      await bridge.connect(hostTransport);
      await app.connect(appTransport);
      assert.equal(initialized, true);
      assert.deepEqual(messages.filter(message => message.method).map(message => message.method),
        ["ui/initialize", "ui/notifications/initialized"]);
      assert.equal(messages[0].params.protocolVersion, "2026-01-26");
      assert.equal(dom.document.documentElement.dataset.theme, "dark");
      await bridge.sendToolInput({ arguments: { deck: JSON.stringify(deck) } });
      await until(() => get("deck-title").textContent === "Test deck");
      assert.equal(get("counter").textContent, "1 / 2");
      assert.equal(dom.document.querySelector("img"), null);
      assert.ok(get("viewport").textContent.includes("<img src=x onerror=alert(1)>"));
      assert.ok(get("viewport").textContent.includes("<img src=x onerror=alert(2)>"));
      assert.ok(get("viewport").textContent.includes("<svg onload=alert(3)>"));
      assert.equal(get("viewport").querySelector("script, svg, img"), null);
      assert.equal(get("notes").textContent, "<script>throw new Error('injected')</script>");
      get("next").click();
      assert.equal(get("counter").textContent, "2 / 2");
      assert.equal(get("notes").textContent, "Speaker notes");
      assert.equal(get("next").disabled, true);
      assert.equal(dom.document.querySelector("img"), null);
      get("prev").click();
      assert.equal(get("counter").textContent, "1 / 2");
      const result = await client.callTool({ name: "present-deck", arguments: { deck: JSON.stringify({ ...deck, title: "Tool result" }) } });
      await bridge.sendToolResult(result);
      await until(() => get("deck-title").textContent === "Tool result");
      get("list").click();
      await until(() => !get("slide-list").hidden);
      assert.deepEqual(calls, ["list-slides"]);
      assert.deepEqual(JSON.parse(get("slide-list").textContent).map(slide => slide.id), ["one", "two"]);
      await bridge.sendHostContextChange({ theme: "light" });
      await until(() => dom.document.documentElement.dataset.theme === "light");
      await bridge.sendToolResult({ content: [], isError: true });
      await until(() => get("status").textContent.includes("could not present"));
      await bridge.sendToolInput({ arguments: { deck: "{" } });
      await until(() => get("status").textContent === "Invalid deck JSON.");
      await bridge.sendToolCancelled({ reason: "Cancelled by user" });
      await until(() => get("status").textContent === "Presentation cancelled.");

      let finish;
      bridge.oncalltool = async params => {
        calls.push(params.name);
        const result = await client.callTool(params);
        await new Promise(resolve => { finish = resolve; });
        return result;
      };
      get("list").click();
      await until(() => !!finish);
      const previousList = get("slide-list").textContent;
      await bridge.teardownResource({});
      finish();
      await tick(20);
      for (const id of ["prev", "next", "list"]) assert.equal(get(id).disabled, true);
      get("list").dispatchEvent(new dom.Event("click"));
      get("next").dispatchEvent(new dom.Event("click"));
      assert.equal(get("slide-list").textContent, previousList);
      assert.equal(get("counter").textContent, "1 / 2");
      assert.equal(calls.length, 2);
    } finally {
      await app.close(); await bridge.close(); await client.close(); await running.close(); await dom.happyDOM.close();
    }
  });

  it("keeps tools disabled on hosts without serverTools and releases controls on close", async () => {
    const dom = new Window();
    dom.document.write(await readFile(new URL("../src/plugins/mcp-app/viewer.html", import.meta.url), "utf8"));
    const app = createViewerApp(dom.document);
    const bridge = new AppBridge(null, { name: "Read-only host", version: "1" }, {});
    const [appTransport, hostTransport] = linkedTransports([]);
    try {
      await bridge.connect(hostTransport);
      await app.connect(appTransport);
      await bridge.sendToolResult({ content: [], structuredContent: { type: "AdaptiveDeck", slides: [] } });
      await tick(0);
      assert.equal(dom.document.getElementById("list").disabled, true);
      assert.equal(dom.document.getElementById("counter").textContent, "0 / 0");
      await app.close();
      assert.equal(dom.document.getElementById("prev").disabled, true);
      assert.equal(dom.document.getElementById("next").disabled, true);
    } finally { await app.close(); await bridge.close(); await dom.happyDOM.close(); }
  });
});
