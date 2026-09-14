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

## Install

```bash
npm install -g @microsoft/flipcard-mcp
```

or run without a global install:

```bash
npx @microsoft/flipcard-mcp
```

## Configure Claude Desktop

macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

Windows: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "flipcard": {
      "command": "npx",
      "args": ["-y", "@microsoft/flipcard-mcp"]
    }
  }
}
```

## Configure GitHub Copilot CLI

See the [GitHub Copilot CLI documentation](https://github.com/github/copilot-cli) for the latest MCP configuration format. A typical stdio entry looks like:

```json
{
  "servers": {
    "flipcard": {
      "command": "npx",
      "args": ["-y", "@microsoft/flipcard-mcp"],
      "transport": "stdio"
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
      "command": "npx",
      "args": ["-y", "@microsoft/flipcard-mcp"]
    }
  }
}
```

## Local development

From `packages/mcp-server`:

```bash
npm run build && npm run start
```

## Programmatic use

```ts
import { createFlipCardServer } from '@microsoft/flipcard-mcp';

const server = createFlipCardServer();
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

- HTTP/SSE transport
- OAuth-protected deployments
- Manifest authoring assistant workflows
