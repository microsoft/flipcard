import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express from "express";
import cors from "cors";
import fs from "node:fs/promises";
import path from "node:path";

const RESOURCE_MIME_TYPE = "text/html;profile=mcp-app";
const RESOURCE_URI = "ui://adaptive-slide/viewer";

export function createServer() {
  const server = new McpServer({
    name: "Adaptive Slide",
    version: "1.0.0",
  });

  // Register the presentation viewer UI resource
  server.resource(
    "adaptive-slide-viewer",
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(import.meta.dirname, "viewer.html"),
        "utf-8",
      );
      return {
        contents: [{ uri: RESOURCE_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  // present-deck tool — accepts deck JSON and returns it for the viewer
  server.registerTool(
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
        parsed = JSON.parse(deck) as Record<string, unknown>;
      } catch {
        return {
          content: [{ type: "text" as const, text: "Error: Invalid JSON" }],
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
        const parsed = JSON.parse(deck) as { slides?: Array<{ id?: string; title?: string }> };
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

// HTTP server entrypoint
export async function startServer(port = 3001) {
  const server = createServer();
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "10mb" }));

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      console.log(`Adaptive Slide MCP server running at http://localhost:${port}/mcp`);
      resolve();
    });
  });
}

// Run directly
const isMainModule = process.argv[1] && (
  process.argv[1].endsWith("server.js") ||
  process.argv[1].endsWith("server.ts")
);

if (isMainModule) {
  const port = parseInt(process.env.PORT ?? "3001", 10);
  startServer(port).catch(console.error);
}
