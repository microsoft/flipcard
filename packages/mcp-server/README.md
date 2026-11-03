# `@microsoft/flipcard-mcp`

`@microsoft/flipcard-mcp` is an MCP server for the [Model Context Protocol](https://modelcontextprotocol.io) that exposes FlipCard manifests, schema helpers, and starter generation flows to coding agents.

## What this server exposes

### Tools

| Tool | Input | Output |
| --- | --- | --- |
| `list_categories` | none | Seven supported FlipCard categories with usage guidance |
| `get_schema` | none | Full FlipCard manifest JSON Schema |
| `validate_manifest` | `{ manifest: unknown }` | `{ valid, errors }` validation result |
| `generate_manifest` | `{ category?, frontTitle?, backTitle?, includeWorkflow? }` | Starter `FlipCardManifest` JSON |
| `describe_component` | `{ framework: 'react' | 'vanilla' | 'core' }` | Markdown overview of the package API |

### Resources

| Resource | Description |
| --- | --- |
| `flipcard://schema` | Manifest schema as `application/schema+json` |
| `flipcard://categories` | Category metadata as JSON |
| `flipcard://examples/{category}` | Starter manifest JSON for a category |
| `ui://flipcard/viewer` | Self-contained interactive MCP App (`text/html;profile=mcp-app`) |

`generate_manifest` preserves its JSON text response and additionally returns
`structuredContent.manifest`. Its `_meta.ui.resourceUri` binds the viewer to that
tool. Hosts without MCP Apps support can continue consuming the text response.

The viewer uses the official MCP Apps SDK lifecycle (Apps revision `2026-01-26`),
handles tool input/results, flips between card faces, and regenerates cards via
host-mediated `tools/call`. It follows the host theme and disables controls on
teardown. All scripts/styles are bundled inline; the resource's CSP requests no
external connections, resources, frames, or base URIs. The host must enforce the
MCP Apps sandbox and resource policy.

## Build from source

The server is distributed with this monorepo. Do not rely on an npm publication
that may not exist. From the repository root:

```bash
npm ci
npm run build
node packages/mcp-server/dist/cli.js
```

Agent Plugins 1.0-compatible hosts can install the built repository root using
its `plugin.json` and `mcp.json`. Otherwise configure the local command below,
replacing the example checkout path with your absolute path.

## Configure Claude Desktop

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "flipcard": {
      "command": "node",
      "args": ["C:\\repos\\flipcard\\packages\\mcp-server\\dist\\cli.js"]
    }
  }
}
```

## Configure GitHub Copilot CLI

See the [GitHub Copilot CLI documentation](https://github.com/github/copilot-cli) for the latest MCP configuration format. A typical stdio entry looks like:

```json
{
  "mcpServers": {
    "flipcard": {
      "type": "stdio",
      "command": "node",
      "args": ["C:\\repos\\flipcard\\packages\\mcp-server\\dist\\cli.js"],
      "tools": ["*"]
    }
  }
}
```

## Configure Cursor / Continue / VS Code MCP extensions

Use the same stdio command shape:

```json
{
  "mcpServers": {
    "flipcard": {
      "command": "node",
      "args": ["C:\\repos\\flipcard\\packages\\mcp-server\\dist\\cli.js"]
    }
  }
}
```

## Local development

From `packages/mcp-server`:

```bash
npm run build && npm run start
```

The build produces both the server/CLI and the self-contained viewer HTML.
Declaration output uses TypeScript separately from tsup (including TypeScript 7).
Use Node.js 22.18+ in 22.x, 24.11+ in 24.x, or 26+ for repository builds.
The server uses the split MCP server/client SDK 2.4 packages and the Node
transport package; the Apps viewer uses `@modelcontextprotocol/ext-apps` 2.0.4.

## Local HTTP transport

Stdio remains the default. Opt into the localhost-only HTTP endpoint:

```bash
node packages/mcp-server/dist/cli.js --transport http --host 127.0.0.1 --port 3000
```

Connect an MCP client to `http://127.0.0.1:3000/mcp`. The official SDK
`createMcpHandler` serves current MCP `2026-07-28` discovery and per-request
metadata, with its stateless `2025-11-25` compatibility fallback. Every request
gets a fresh server and transport; there are no protocol session IDs or shared
client state. GET, HEAD, DELETE, PUT, and OPTIONS are not separate endpoints:
only POST is supported (405 otherwise).

Host and Origin headers are validated against loopback hosts. No wildcard CORS,
authentication, remote binding, OAuth, or legacy HTTP+SSE endpoint is provided.
Only `127.0.0.1`, `localhost`, and `::1` may be bound. CLI ports must be whole
numbers from 1 to 65535; programmatic use additionally accepts port 0.

## Programmatic use

```ts
import { createFlipCardServer } from '@microsoft/flipcard-mcp';

const server = createFlipCardServer();
```

```ts
import { startFlipCardHttpServer } from '@microsoft/flipcard-mcp';

const endpoint = await startFlipCardHttpServer({ port: 0 });
console.log(endpoint.url);
// On application shutdown:
await endpoint.close();
```

## Tool examples

### `list_categories`

Input:

```json
{}
```

Output excerpt:

```json
[
  {
    "category": "teal",
    "description": "Primary action cards for live content and launch points."
  }
]
```

### `get_schema`

Input:

```json
{}
```

Output excerpt:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "FlipCardManifest"
}
```

### `validate_manifest`

This calls the narrow core runtime validator, not a complete draft-07 engine.
It does not validate arbitrary design/schema payloads, certify compatibility
with React/vanilla asset types, or authorize workflow actions.

Input:

```json
{
  "manifest": {
    "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json",
    "version": "0.1.0",
    "id": "flipcard-example",
    "title": "Example card"
  }
}
```

Output:

```json
{
  "valid": true,
  "errors": []
}
```

### `generate_manifest`

Input:

```json
{
  "category": "gold",
  "frontTitle": "Launch status",
  "backTitle": "Launch manifest",
  "includeWorkflow": true
}
```

Output excerpt:

```json
{
  "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json",
  "version": "0.1.0",
  "id": "flipcard-1712345678901"
}
```

### `describe_component`

Input:

```json
{
  "framework": "react"
}
```

Output excerpt:

```json
{
  "framework": "react",
  "markdown": "# `@microsoft/flipcard-react`\n..."
}
```

## Roadmap

- OAuth-protected deployments
- Manifest authoring assistant workflows
