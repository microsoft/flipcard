---
sidebar_position: 5
title: '@microsoft/flipcard-mcp'
---

# `@microsoft/flipcard-mcp`

A [Model Context Protocol](https://modelcontextprotocol.io/) server that exposes FlipCard authoring to any MCP‑capable agent host (Copilot Studio, Claude Desktop, VS Code, custom CLI agents…). Use it to let an LLM list categories, fetch the schema, generate starter manifests, and validate drafts before persisting them.

## Install / run

```bash
# zero‑install
npx -y @microsoft/flipcard-mcp

# or add to a project
npm install @microsoft/flipcard-mcp
```

The package exports `createFlipCardServer()` plus the tool/resource registration helpers if you want to embed FlipCard inside a larger MCP server.

## Add to an agent host

```jsonc
{
  "mcpServers": {
    "flipcard": {
      "command": "npx",
      "args": ["-y", "@microsoft/flipcard-mcp"]
    }
  }
}
```

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

Returns a fully‑formed `FlipCardManifest` referencing the published schema URL.

## Resources

In addition to tools, the server exposes resources clients can fetch by URI:

- `flipcard://schema` — the manifest JSON Schema.
- `flipcard://categories` — the category preset list with descriptions.
- `flipcard://example/{category}` — a starter manifest for the given category.

Use the helpers `getSchemaResource`, `getCategoriesResource`, and `getExampleResource` to obtain them programmatically.

## Embed in your own server

```ts
import { createFlipCardServer } from '@microsoft/flipcard-mcp';

const server = createFlipCardServer({
  // any McpServer options
});

await server.connect(/* your transport */);
```

Or compose individually:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerFlipCardTools, registerFlipCardResources } from '@microsoft/flipcard-mcp';

const server = new McpServer({ name: 'my-server', version: '1.0.0' });
registerFlipCardTools(server);
registerFlipCardResources(server);
```

## See also

- **[Agent authoring](../guides/agent-authoring)** — patterns for prompting agents to produce great cards.
- **[Manifest reference](../reference/manifest)** — the underlying JSON Schema.
