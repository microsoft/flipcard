# Adaptive Slide

A schema-driven presentation builder/viewer built on the [Adaptive Cards](https://adaptivecards.io/) open card exchange format.

## Concept

Each **Slide** is an Adaptive Card bucket containing **Adaptive Tiles** — modular content blocks, each defined by its own tile card schema. This makes presentations portable, schema-validated, and renderable across any Adaptive Cards host.

```
Deck (Presentation)
  └── Slide[]                        ← sequential pages
       └── Adaptive Card Bucket      ← the slide IS an Adaptive Card
            └── Adaptive Tile[]       ← content blocks (text, image, code, chart…)
                 └── Tile Card Schema ← per-type JSON schema
```

## Architecture

| Layer | Purpose |
|-------|---------|
| **Deck** | Presentation container — metadata, theme, slide ordering |
| **Slide** | A single page — layout mode, background, transitions |
| **Bucket** | The Adaptive Card root — composes tiles into a renderable card |
| **Tile** | Atomic content unit — text, image, code, chart, media, container |

## Quick Start

```bash
npm install
npm run validate   # validate example decks against schemas
npm run build      # compile TypeScript + bundle viewer
npm run serve      # start MCP App server on :3001
```

## MCP App Plugin

Adaptive Slide includes an MCP App plugin that transforms deck JSON into interactive presentations rendered inside MCP hosts (Claude Desktop, VS Code Copilot, etc.).

### How It Works

```
Deck JSON ──▶ present-deck tool ──▶ MCP Host ──▶ Viewer (sandboxed iframe)
```

1. The MCP server registers a `present-deck` tool with a `ui://` resource URI
2. When called, the host fetches the self-contained viewer HTML
3. The viewer receives deck JSON via the MCP App postMessage protocol
4. Slides render with full navigation, keyboard shortcuts, and theming

### Running the Server

```bash
# Development (with tsx)
npm run dev

# Production
npm run build && npm run serve

# Custom port
PORT=8080 npm run serve
```

### Connecting to Claude Desktop

```bash
# Tunnel local server for Claude
npx cloudflared tunnel --url http://localhost:3001
# Then add the tunnel URL as a custom connector in Claude
```

### Tools

| Tool | Description |
|------|-------------|
| `present-deck` | Renders a deck as an interactive MCP App |
| `list-slides` | Returns slide metadata (titles, IDs) |

See [`examples/hello-world.deck.json`](examples/hello-world.deck.json) for a working example.

## Schemas

All schemas live in `schemas/` and follow [JSON Schema Draft 2020-12](https://json-schema.org/draft/2020-12/json-schema-core).

| Schema | Description |
|--------|-------------|
| `deck.schema.json` | Root presentation schema |
| `slide.schema.json` | Individual slide definition |
| `tile.schema.json` | Base tile interface |
| `tiles/*.schema.json` | Built-in tile type schemas |

## Documentation

- [Technical Specification](docs/spec/technical-specification.md)
- [Wiki: Home](docs/wiki/Home.md)
- [Wiki: Architecture](docs/wiki/Architecture.md)
- [Wiki: Schema Reference](docs/wiki/Schema-Reference.md)
- [Wiki: Getting Started](docs/wiki/Getting-Started.md)
- [Wiki: MCP App Plugin](docs/wiki/MCP-App-Plugin.md)

## License

MIT
