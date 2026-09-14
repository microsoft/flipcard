---
sidebar_position: 2
title: Getting started
---

# Getting started

FlipCard ships as a small set of independently installable packages. Pick the renderer that matches your stack — they all consume the same manifest.

## Requirements

- Node.js **≥ 20**
- npm **≥ 10** (or your favorite alternative)

## Install

```bash
# Core types, controller, and schema (framework agnostic)
npm install @microsoft/flipcard-core

# React renderer
npm install @microsoft/flipcard-react

# Vanilla / web component renderer
npm install @microsoft/flipcard

# Shared design tokens
npm install @microsoft/flipcard-themes
```

## Render your first card (React)

```tsx
import { FlipCard } from '@microsoft/flipcard-react';
import '@microsoft/flipcard-themes/styles/light.css';

const asset = {
  id: 'welcome',
  category: 'teal',
  theme: 'light',
  design: {
    title: 'Hello FlipCard',
    summary: 'Click to see the manifest.',
  },
  manifest: {
    $schema: 'https://microsoft.github.io/flipcard/schema/v0.1.json',
    id: 'welcome',
    title: 'Welcome',
  },
};

export function App() {
  return (
    <FlipCard
      asset={asset}
      interactive
      onFlip={(state) => console.log('now showing:', state)}
    />
  );
}
```

## Render your first card (vanilla)

```html
<link rel="stylesheet" href="/path/to/@microsoft/flipcard-themes/styles/light.css" />
<script type="module">
  import { defineFlipCard } from '@microsoft/flipcard';
  defineFlipCard();
</script>

<flip-card
  front-title="Hello FlipCard"
  back-title="Welcome"
  flip-hint="Click to flip"
  show-flip-hint
></flip-card>
```

## Use the controller without a UI

```ts
import { FlipCardController, validateManifest } from '@microsoft/flipcard-core';

const controller = new FlipCardController({
  defaultState: 'front',
  onChange: (state) => console.log('flipped to', state),
});

controller.flip();           // 'back'
controller.set('front');     // 'front'
controller.subscribe((s) => console.log(s));

validateManifest({ id: 'demo', title: 'Hello' });
// → { valid: true, errors: [] }
```

## Generate a manifest with an LLM agent

Add the FlipCard MCP server to your agent host (Copilot Studio, Claude Desktop, VS Code, etc.):

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

The agent can now call:

- `list_categories` — discover the `teal | navy | gold | green | red | plum | slate` presets.
- `get_schema` — fetch the manifest JSON Schema.
- `generate_manifest` — produce a starter card for a chosen category.
- `validate_manifest` — verify a draft before persisting it.
- `describe_component` — get the API surface for `react`, `vanilla`, or `core`.

See **[MCP server](./packages/mcp-server)** for full details.

## Next

- **[Core concepts](./concepts)** — what design, schema, and workflow really mean here.
- **[Authoring manifests](./guides/authoring-manifests)** — patterns for hand‑written cards.
- **[Categories & themes](./guides/categories-and-themes)** — pick the right preset.
