---
sidebar_position: 2
title: Getting started
---

# Getting started

Build FlipCard from this repository before using its workspace package imports.
Published npm packages are not required or assumed. React and vanilla share asset
types, but do not promise identical rendering.

## Requirements

- Node.js **22.18+ (22.x), 24.11+ (24.x), or 26+**
- npm **10+**
- React **18.3.1+ within 18.x, or 19.x** for the React renderer

## Install

```bash
git clone https://github.com/microsoft/flipcard.git
cd flipcard
npm ci
npm run build
npm run dev
```

The Vite showcase is a working consumer of the local workspace packages. Use
`npm run build:libs` when only library artifacts are needed. TypeScript 7 is the
compiler; lint tooling uses an isolated TypeScript 6 dependency.

## Render your first card (React)

```tsx
import { FlipCard, type FlipCardRenderableAsset } from '@microsoft/flipcard-react';
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';

const asset: FlipCardRenderableAsset = {
  id: 'welcome',
  category: 'status',
  title: 'Welcome',
  summary: 'Click to see the manifest.',
  theme: 'light',
  manifest: {
    $schema: 'https://microsoft.github.io/flipcard/schema/v0.1.json',
    id: 'welcome',
    title: 'Welcome',
    design: {
      kind: 'status',
      headline: 'Hello FlipCard',
      summary: 'Click to see the manifest.',
    },
    schema: { status: 'ready' },
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

```ts
import { createFlipCardElement, flipCardAssetLibrary } from '@microsoft/flipcard';
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';

const asset = flipCardAssetLibrary[0];
if (asset) {
  const button = createFlipCardElement(asset, { defaultState: 'front' });
  button.addEventListener('click', () => console.log(button.dataset.state));
  document.body.append(button);
}
```

This creates an ordinary `HTMLButtonElement`. There is no `defineFlipCard`,
`/auto` entry point, or `flipcard:flip` custom event.

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
      "command": "node",
      "args": ["C:\\repos\\flipcard\\packages\\mcp-server\\dist\\cli.js"]
    }
  }
}
```

Replace the example path with your built checkout. Configuration wrappers vary
by host; stdio is the default transport. The agent can call:

- `list_categories` — discover the `teal | navy | gold | green | red | plum | slate` presets.
- `get_schema` — fetch the manifest JSON Schema.
- `generate_manifest` — produce a starter card for a chosen category.
- `validate_manifest` — verify a draft before persisting it.
- `describe_component` — get the API surface for `react`, `vanilla`, or `core`.

These seven presets are MCP authoring categories, not the asset category type.
See **[MCP server](./packages/mcp-server.md)** for HTTP and MCP Apps details.
For local Agent Plugins installation, ACP sessions, and Activity adapters, see
**[Agent authoring](./guides/agent-authoring.md)**.

## Stock quote card

The showcase's MSFT card defaults to **Not configured**, not a fabricated live
price. To enable it, set `VITE_STOCK_QUOTE_ENDPOINT` before starting Vite or
building the showcase. For example, with your own same-origin JSON endpoint:

```powershell
$env:VITE_STOCK_QUOTE_ENDPOINT = '/api/quotes/msft'
npm run dev
```

Polling is wired into the FlipDeck showcase, not the static asset library.
Importing `flipCardAssetLibrary` into another application does not start network
requests; that host must supply its own quote-client lifecycle and hydration.
The Docusaurus site links to the separately built FlipDeck gallery.

That route is an example, not a server supplied by this repository. GitHub Pages
serves static files and does not implement a quote API. Alternatively configure
a public HTTPS URL with browser CORS enabled for your site's origin.
Vite embeds this value in client code: **never put private API keys, tokens, or
credentials in it**. Host any authenticated provider integration on your own
backend, and confirm provider licensing and redistribution terms.

The endpoint returns JSON `null` for no quote, or this contract:

```ts
interface QuoteResponse {
  symbol: 'MSFT';
  currency: 'USD';
  price: number;
  asOf: string; // Actual market timestamp: ISO 8601 with Z or a numeric offset.
  provider: string;
  delay: 'delayed' | 'end-of-day' | 'real-time';
  change?: number;
  changePercent?: number;
  open?: number;
  high?: number;
  low?: number;
}
```

Use the provider's market timestamp, not the HTTP response time. Prices must be
positive finite numbers. Provider and delay labels are displayed with the quote;
a successful refresh is not proof of real-time market data.

The showcase polls every **5 minutes**, times requests out after **10 seconds**,
and pauses while hidden or offline. It marks source timestamps older than
**36 hours** stale. Loading, error, offline, and no-data states retain the last
received quote with an explicit status; missing values remain unavailable.
No synthetic prices or automatic anonymous-provider fallback are supplied.
Requests omit credentials and referrers. Deployment owners must verify endpoint
availability, browser CORS, and data rights; none is established by a local build.

## Next

- **[Core concepts](./concepts.md)** — what design, schema, and workflow really mean here.
- **[Authoring manifests](./guides/authoring-manifests.md)** — patterns for hand-written cards.
- **[Categories & themes](./guides/categories-and-themes.md)** — pick the right preset.
