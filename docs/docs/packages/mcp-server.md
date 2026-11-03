---
sidebar_position: 5
title: '@microsoft/flipcard-mcp'
---

# `@microsoft/flipcard-mcp`

A [Model Context Protocol](https://modelcontextprotocol.io/) server for FlipCard
authoring. It targets MCP **2026-07-28** with the split
`@modelcontextprotocol/server` / `client` **2.4** SDKs and the Node transport
package. SDK versions and wire protocol revisions are separate.

## Build and run locally

Use the [supported Node versions](../getting-started.md) and build this source
checkout. These instructions do not assume an npm publication.

```bash
npm ci
npm run build:libs
node packages/mcp-server/dist/cli.js
```

The package exports `createFlipCardServer()` plus the tool/resource registration helpers if you want to embed FlipCard inside a larger MCP server.

## Add to an agent host

```jsonc
{
  "mcpServers": {
    "flipcard": {
      "command": "node",
      "args": ["C:\\repos\\flipcard\\packages\\mcp-server\\dist\\cli.js"]
    }
  }
}
```

Replace the example path with the absolute path to your built checkout. Host
configuration wrappers differ; consult your client's MCP settings. Stdio is the
default and stdout is reserved for protocol messages.

### Localhost HTTP

```bash
node packages/mcp-server/dist/cli.js --transport http --host 127.0.0.1 --port 3000
```

Connect to `http://127.0.0.1:3000/mcp`. The SDK's `createMcpHandler` provides
current discovery/per-request metadata and a stateless **2025-11-25** compatibility
fallback. Each request gets a fresh server and transport; there are no protocol
session IDs or shared client state.

Only POST is supported; other methods return 405. Binding is restricted to
`127.0.0.1`, `localhost`, or `::1`, and Host/Origin checks reject non-loopback
hosts. CLI ports must be integers from 1 to 65535. There is no remote binding,
wildcard CORS, authentication, OAuth, or legacy HTTP+SSE endpoint. Localhost
validation is not a substitute for authentication in a remote service.

## Tools

| Tool | Description |
|---|---|
| `list_categories` | List the seven supported FlipCard category presets and their intended use. |
| `get_schema` | Return the FlipCard manifest JSON Schema. |
| `validate_manifest` | Validate a candidate FlipCard manifest with the core runtime validator. |
| `generate_manifest` | Generate a starter FlipCard manifest for a category and optional titles. |
| `describe_component` | Describe the public FlipCard API surface for `react`, `vanilla`, or `core`. |

### `generate_manifest` input

```ts
{
  category?: 'teal' | 'navy' | 'gold' | 'green' | 'red' | 'plum' | 'slate';
  frontTitle?: string;
  backTitle?: string;
  includeWorkflow?: boolean;
}
```

Returns a starter `FlipCardManifest` referencing the published schema URL as
both JSON text and `structuredContent.manifest`. A starter is not a renderable
asset: the React and vanilla APIs require an asset wrapper and a renderer-specific
`manifest.design` shape.

`validate_manifest` calls the lightweight core validator, not a complete JSON
Schema validator or action safety checker. See the [validation limits](../reference/manifest.md#runtime-validator).

## Resources

In addition to tools, the server exposes resources clients can fetch by URI:

- `flipcard://schema` — the manifest JSON Schema.
- `flipcard://categories` — the category preset list with descriptions.
- `flipcard://examples/{category}` — a starter manifest for the given category.
- `ui://flipcard/viewer` — the self-contained MCP Apps viewer.

Use the helpers `getSchemaResource`, `getCategoriesResource`, and `getExampleResource` to obtain them programmatically.

## MCP Apps viewer

The viewer implements MCP Apps **2026-01-26**, using
`@modelcontextprotocol/ext-apps` **2.0.4**. `generate_manifest` declares
`_meta.ui.resourceUri: "ui://flipcard/viewer"`; that resource has MIME type
`text/html;profile=mcp-app`. Clients without Apps support still receive JSON text.

Scripts and styles are bundled inline: no CDN, remote assets, or connection
domains are requested. The viewer follows the SDK lifecycle, handles tool
input/results, adopts host theme updates, and disables controls on teardown.
Regeneration goes through host-mediated `tools/call`, not direct server access.
Untrusted manifest text is displayed as text, not executable markup. The host
must enforce the Apps sandbox and resource CSP; this is a bounded manifest
viewer, not a general HTML or Adaptive Card execution environment.

## Embed in your own server

```ts
import { createFlipCardServer } from '@microsoft/flipcard-mcp';
import type { McpServer } from '@modelcontextprotocol/server';

const server: McpServer = createFlipCardServer({
  name: 'my-flipcard-server',
  version: '1.0.0',
});
```

These are the only factory options. Attach a compatible split-SDK transport in
your host. The factory registers tools, data resources, and the Apps resource
together. The exported `registerFlipCardTools` / `registerFlipCardResources`
helpers do not register the Apps viewer; manual composition must also satisfy
the tool's UI resource binding. Prefer the factory for a complete server.

For a managed local HTTP listener:

```ts
import { startFlipCardHttpServer } from '@microsoft/flipcard-mcp';

const endpoint = await startFlipCardHttpServer({ port: 0 });
console.log(endpoint.url);
// On application shutdown:
await endpoint.close();
```

Port 0 is available programmatically for OS-assigned ports, not on the CLI.

## See also

- **[Agent authoring](../guides/agent-authoring)** — patterns for prompting agents to produce great cards.
- **[Manifest reference](../reference/manifest)** — the underlying JSON Schema.
