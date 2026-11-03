import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client, StreamableHTTPClientTransport } from "@modelcontextprotocol/client";

// Test transformer
import { renderTile, renderSlide, renderDeck } from "../dist/transformer.js";

const EXAMPLE_DECK = JSON.parse(
  readFileSync(resolve(import.meta.dirname, "../examples/hello-world.deck.json"), "utf-8")
);

describe("Transformer", () => {
  it("renders a full deck to HTML", () => {
    const html = renderDeck(EXAMPLE_DECK);
    assert.ok(html.includes("Adaptive Slide"));
    assert.ok(html.includes("class=\"slide\""));
  });

  it("renders a text tile", () => {
    const tile = { type: "Tile.Text", text: "Hello **world**", style: "heading" };
    const html = renderTile(tile);
    assert.ok(html.includes("<strong>world</strong>"));
    assert.ok(html.includes("tile-text"));
  });

  it("renders an image tile", () => {
    const tile = { type: "Tile.Image", url: "https://example.com/img.png", altText: "test" };
    const html = renderTile(tile);
    assert.ok(html.includes("<img"));
    assert.ok(html.includes("example.com/img.png"));
  });

  it("renders a code tile", () => {
    const tile = { type: "Tile.Code", code: "const x = 1;", language: "javascript" };
    const html = renderTile(tile);
    assert.ok(html.includes("const x = 1;"));
    assert.ok(html.includes("<pre"));
  });

  it("renders a chart tile", () => {
    const tile = {
      type: "Tile.Chart",
      chartType: "bar",
      data: { labels: ["A", "B"], datasets: [{ values: [10, 20] }] },
    };
    const html = renderTile(tile);
    assert.ok(html.includes("tile-chart"));
  });

  it("renders a container tile with nested tiles", () => {
    const tile = {
      type: "Tile.Container",
      layout: "row",
      items: [
        { type: "Tile.Text", text: "Left" },
        { type: "Tile.Text", text: "Right" },
      ],
    };
    const html = renderTile(tile);
    assert.ok(html.includes("tile-container"));
    assert.ok(html.includes("Left"));
    assert.ok(html.includes("Right"));
  });

  it("hides invisible tiles", () => {
    const tile = { type: "Tile.Text", text: "Hidden", isVisible: false };
    const html = renderTile(tile);
    assert.equal(html, "");
  });

  it("renders a slide with grid layout", () => {
    const slide = {
      type: "AdaptiveSlide",
      layout: { mode: "grid", columns: 3 },
      body: [
        { type: "Tile.Text", text: "Cell", gridPosition: { column: 1, row: 1 } },
      ],
    };
    const html = renderSlide(slide);
    assert.ok(html.includes("grid-template-columns"));
    assert.ok(html.includes("repeat(3"));
  });

  it("renders background gradient", () => {
    const slide = {
      type: "AdaptiveSlide",
      background: { gradient: { type: "linear", colors: ["#ff0000", "#0000ff"], angle: 90 } },
      body: [{ type: "Tile.Text", text: "Gradient" }],
    };
    const html = renderSlide(slide);
    assert.ok(html.includes("linear-gradient"));
  });

  it("renders each slide in the example deck", () => {
    for (const slide of EXAMPLE_DECK.slides) {
      const html = renderSlide(slide, EXAMPLE_DECK.theme, EXAMPLE_DECK.defaults);
      assert.ok(html.length > 0, `Slide ${slide.id} should render`);
      assert.ok(html.includes("class=\"slide\""), `Slide ${slide.id} should have slide class`);
    }
  });
});

describe("Viewer HTML", () => {
  it("ships a self-contained SDK App bundle", () => {
    const viewer = readFileSync(
      resolve(import.meta.dirname, "../dist/plugins/mcp-app/viewer.html"),
      "utf-8"
    );
    assert.ok(viewer.includes("ui/notifications/tool-result"));
    assert.ok(viewer.includes("ui/initialize"));
    assert.ok(viewer.includes("AdaptiveDeck"));
    assert.ok(viewer.includes("ui/notifications/initialized"));
    assert.ok(!/<script[^>]*src=|<!-- APP_SCRIPT -->/.test(viewer));
  });

  describe("Stateless MCP endpoint", () => {
    for (const mode of ["auto", "legacy"]) {
      it(`serves concurrent ${mode} clients without reusing a connected server`, async () => {
        const { startServer } = await import("../dist/plugins/mcp-app/server.js");
        const running = await startServer(0);
        const clients = ["first", "second"].map(name =>
          new Client({ name, version: "1" }, { versionNegotiation: { mode } }));
        try {
          await Promise.all(clients.map(client => client.connect(new StreamableHTTPClientTransport(new URL(running.url)))));
          if (mode === "auto") assert.equal(clients[0].getNegotiatedProtocolVersion(), "2026-07-28");
          const tools = await clients[0].listTools();
          assert.equal(tools.tools.find(tool => tool.name === "present-deck")._meta.ui.resourceUri, "ui://adaptive-slide/viewer");
          const results = await Promise.all(clients.map((client, i) => client.callTool({
            name: "present-deck",
            arguments: { deck: JSON.stringify({ ...EXAMPLE_DECK, title: `Deck ${i}` }) },
          })));
          assert.equal(results[0].structuredContent.title, "Deck 0");
          assert.equal(results[1].structuredContent.title, "Deck 1");
          const resource = await clients[0].readResource({ uri: "ui://adaptive-slide/viewer" });
          assert.equal(resource.contents[0].mimeType, "text/html;profile=mcp-app");
          assert.deepEqual(resource.contents[0]._meta.ui.csp.connectDomains, []);
          const invalid = await clients[0].callTool({ name: "present-deck", arguments: { deck: "null" } });
          assert.equal(invalid.isError, true);
          for (const method of ["GET", "DELETE"]) {
            const response = await fetch(running.url, { method });
            assert.equal(response.status, 405);
            await response.text();
          }
          const rejected = await fetch(running.url, { method: "POST", headers: { Origin: "https://evil.example" } });
          assert.equal(rejected.status, 403);
          assert.equal(rejected.headers.get("access-control-allow-origin"), null);
          await rejected.text();
        } finally {
          await Promise.all(clients.map(client => client.close()));
          await running.close();
        }
      });
    }
  });
});

describe("MCP Server module", () => {
  it("exports createServer function", async () => {
    const mod = await import("../dist/plugins/mcp-app/server.js");
    assert.ok(typeof mod.createServer === "function");
    assert.ok(typeof mod.startServer === "function");
  });

  it("creates a server instance", async () => {
    const { createServer } = await import("../dist/plugins/mcp-app/server.js");
    const server = createServer();
    assert.ok(server, "Server should be created");
  });
});
