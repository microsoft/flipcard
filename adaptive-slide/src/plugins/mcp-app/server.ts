#!/usr/bin/env node
/// <reference types="node" />
import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import { registerAppTool, registerAppResource, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { localhostHostValidation, localhostOriginValidation, toNodeHandler } from "@modelcontextprotocol/node";
import { z } from "zod";
import { createServer as createHttpServer } from "node:http";
import { pathToFileURL } from "node:url";
import fs from "node:fs/promises";
import path from "node:path";

const RESOURCE_URI = "ui://adaptive-slide/viewer";
const UI_META = { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [], baseUriDomains: [] } } };

function parseDeck(input: string): Record<string, unknown> & { slides: Array<Record<string, unknown>> } {
  const parsed = JSON.parse(input);
  if (!parsed || typeof parsed !== "object" || parsed.type !== "AdaptiveDeck" ||
      !Array.isArray(parsed.slides) || !parsed.slides.every((slide: unknown) =>
        slide !== null && typeof slide === "object" && !Array.isArray(slide))) {
    throw new Error("Expected an AdaptiveDeck object with a slides array.");
  }
  return parsed;
}

export function createServer() {
  const server = new McpServer({
    name: "Adaptive Slide",
    version: "1.0.0",
  });

  // Register the presentation viewer UI resource
  registerAppResource(server,
    "adaptive-slide-viewer",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE, _meta: UI_META },
    async () => {
      const html = await fs.readFile(
        new URL("../../../dist/plugins/mcp-app/viewer.html", import.meta.url),
        "utf-8",
      );
      return {
        contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: UI_META }],
      };
    },
  );

  // present-deck tool — accepts deck JSON and returns it for the viewer
  registerAppTool(server,
    "present-deck",
    {
      title: "Present Deck",
      description:
        "Render an Adaptive Slide deck as an interactive presentation. " +
        "Pass the full deck JSON object and it will be displayed in the viewer.",
      inputSchema: {
        deck: z.string().describe(
          "The full Adaptive Slide deck as a JSON string (type: AdaptiveDeck)"
        ),
      },
      annotations: {
        title: "Present Deck",
        readOnlyHint: true,
        openWorldHint: false,
      },
      _meta: {
        ui: { resourceUri: RESOURCE_URI },
      },
    },
    async ({ deck }) => {
      // Validate it parses as JSON
      let parsed: Record<string, unknown>;
      try {
        parsed = parseDeck(deck);
      } catch {
        return {
          content: [{ type: "text" as const, text: "Error: Invalid JSON or AdaptiveDeck shape" }],
          isError: true,
        };
      }

      // Return the deck JSON for the viewer to render
      return {
        content: [{ type: "text" as const, text: JSON.stringify(parsed) }],
        structuredContent: parsed,
      };
    },
  );

  // list-slides tool — returns slide metadata from a deck
  server.registerTool(
    "list-slides",
    {
      title: "List Slides",
      description: "List slide titles and IDs from an Adaptive Slide deck.",
      inputSchema: {
        deck: z.string().describe("The Adaptive Slide deck JSON string"),
      },
    },
    async ({ deck }) => {
      try {
        const parsed = parseDeck(deck);
        const slides = (parsed.slides ?? []).map((s, i) => ({
          index: i,
          id: s.id ?? null,
          title: s.title ?? `Slide ${i + 1}`,
        }));
        return {
          content: [{ type: "text" as const, text: JSON.stringify(slides, null, 2) }],
        };
      } catch {
        return {
          content: [{ type: "text" as const, text: "Error: Invalid JSON" }],
          isError: true,
        };
      }
    },
  );

  return server;
}

export async function startServer(port = 3001, host = "127.0.0.1") {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error("Invalid port");
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) throw new Error("Only loopback hosts are supported; this endpoint has no authentication.");
  const handler = createMcpHandler(() => createServer());
  const nodeHandler = toNodeHandler(handler);
  const validHost = localhostHostValidation();
  const validOrigin = localhostOriginValidation();
  const http = createHttpServer((req, res) => {
    if (!validHost(req, res) || !validOrigin(req, res)) return;
    if (req.url?.split("?")[0] !== "/mcp") {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    void nodeHandler(req, res);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      http.once("error", reject);
      http.listen(port, host, () => { http.off("error", reject); resolve(); });
    });
  } catch (error) {
    await handler.close();
    throw error;
  }
  const address = http.address();
  if (!address || typeof address === "string") throw new Error("No listen address");
  return {
    server: http,
    url: `http://${host.includes(":") ? `[${host}]` : host}:${address.port}/mcp`,
    close: async () => {
      await handler.close();
      await new Promise<void>((resolve, reject) => {
        http.close(error => error ? reject(error) : resolve());
        http.closeIdleConnections();
      });
    },
  };
}

// Run directly
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMainModule) {
  const port = process.env.PORT ?? "3001";
  if (!/^[0-9]+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
    console.error("PORT must be an integer from 1 to 65535.");
    process.exitCode = 1;
  } else {
    startServer(Number(port)).then(running => {
      console.error(`Adaptive Slide MCP listening on ${running.url}`);
      const shutdown = () => {
        void running.close().then(() => process.exit(0), error => {
          console.error(error);
          process.exit(1);
        });
      };
      process.once("SIGINT", shutdown);
      process.once("SIGTERM", shutdown);
    }).catch(error => { console.error(error); process.exitCode = 1; });
  }
}
