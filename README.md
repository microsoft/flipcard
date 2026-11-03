# 🎴 flipcard

**The first primitive in an adaptive, manifest schema-driven, composable UI system.**

> Front = rendered design. Back = schema / manifest. Click to flip.  
> FlipCard separates **design ⟂ schema ⟂ workflow** so each can evolve independently.

## Vision

Inspired by Adaptive Cards, but generalized. Any UI element — a button, a dashboard tile, an OS shell pane — can be a flipcard. The schema is portable; the design is swappable; the workflow is independent.

FlipCard starts with a simple idea:

- **Front**: the designed experience people use
- **Back**: the manifest, schema, or system representation
- **Flip**: the bridge between what users see and what systems understand

That makes FlipCard a primitive for composable interfaces, adaptive surfaces, and eventually full UI shells built from schema-aware cards.

## Quickstart

Build the local source checkout first; these examples do not assume the packages
are published to npm. Use Node.js **22.18+ (22.x), 24.11+ (24.x), or 26+** and npm 10+.

```bash
npm ci
npm run build
npm run dev
```

### React

```tsx
import { FlipCard } from '@microsoft/flipcard-react';
import { flipCardAssetLibrary } from '@microsoft/flipcard';
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';

export function App() {
  const asset = flipCardAssetLibrary[0];
  return asset ? <FlipCard asset={asset} onFlip={console.log} /> : null;
}
```

### Vanilla DOM

```ts
import { createFlipCardElement, flipCardAssetLibrary } from '@microsoft/flipcard';
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';

const asset = flipCardAssetLibrary[0];
if (asset) document.body.append(createFlipCardElement(asset));
```

The vanilla API creates an `HTMLButtonElement`; it does not register a custom
element or export `/auto`. React accepts an `asset`, not `front`/`backJson` props.
See the [getting-started guide](https://microsoft.github.io/flipcard/getting-started).

## Packages

| Package | Description | Local source |
| --- | --- | --- |
| `@microsoft/flipcard-core` | Framework-agnostic types, schema, controller | `packages/core` |
| `@microsoft/flipcard-react` | React asset components | `packages/react` |
| `@microsoft/flipcard` | DOM renderer and asset library | `packages/vanilla` |
| `@microsoft/flipcard-themes` | CSS themes and tokens | `packages/themes` |
| `@microsoft/flipcard-mcp` | MCP server and MCP Apps viewer | `packages/mcp-server` |
| `@microsoft/flipcard-acp` | ACP v1 streaming client | `packages/acp-client` |
| `@microsoft/flipcard-activity` | Activity envelopes and Adaptive Card adapters | `packages/activity` |

## Architecture

```text
flipcard
├─ packages
│  ├─ core       -> schema, controller, types
│  ├─ react      -> FlipCard and FlipCardCatalog
│  ├─ vanilla    -> DOM renderer and asset library
│  ├─ themes     -> CSS themes and tokens
│  ├─ mcp-server -> MCP tools, resources, and Apps viewer
│  ├─ acp-client -> stream-injected ACP client
│  └─ activity   -> transport-free Activity adapters
├─ apps
│  └─ showcase   -> FlipDeck (Vite gallery, deployed to /flipdeck/ and /showcase/)
└─ .github
   └─ workflows  -> CI, Pages deploy, release automation
```

## Live Links

- Documentation: <https://microsoft.github.io/flipcard/>
- FlipDeck (interactive gallery): <https://microsoft.github.io/flipcard/flipdeck/>
- Manifest schema: <https://microsoft.github.io/flipcard/schema/v0.1.json>

## Development

```bash
npm ci
npm run build:libs
npm run dev          # FlipDeck (Vite dev server)
npm test
npm run build
```

TypeScript 7 compiles the workspaces. TypeScript 6 is isolated in the lint
tooling workspace for parser compatibility, not used as the application compiler.
The [documentation deployment](./docs/README.md) uses GitHub Actions, not Jekyll.

The showcase MSFT quote card defaults to **Not configured**. Set
`VITE_STOCK_QUOTE_ENDPOINT` to your public HTTPS (or same-origin) JSON endpoint
before development/build to enable five-minute refreshes. Do not embed private
API keys in Vite environment variables. Provider availability, licensing, and
browser CORS must be verified by the hosting owner; no anonymous-provider
fallback or synthetic live prices are supplied. See
[the endpoint contract and state behavior](./docs/docs/getting-started.md#stock-quote-card).

### Agent Plugins 1.0

The repository root is an [Agent Plugins 1.0.0](https://agent-plugins.org/specification)
plugin. `plugin.json` describes the plugin, and `mcp.json` launches the built
Flipcard MCP server over stdio. The schema version is independent of the plugin's
release version.

Clone this repository, run `npm ci` and `npm run build`, then install the local
repository directory in an Agent Plugins 1.0-compatible client. For Copilot CLI:

```bash
copilot plugin install .
```

The client expands `${PLUGIN_ROOT}` in the server arguments and working directory.
Keep the built repository and its installed dependencies available at that path.
This is a local-source distribution, not a dependency on an unpublished npm package.
Installing the plugin does not grant filesystem access or automatically approve
tool execution; the host retains its normal permission controls.

The published 1.0.0 schemas are included under `schemas/agent-plugins/1.0.0` so
the manifest tests run offline against the exact targeted specification.

### Agent Client Protocol

`@microsoft/flipcard-acp` implements the stable
[Agent Client Protocol v1](https://agentclientprotocol.com/protocol/v1/initialization)
client profile using `@agentclientprotocol/sdk` 2.0.2. SDK version 2 does not mean
ACP wire protocol v2. The host supplies UTF-8 NDJSON streams and owns process
startup, authentication, and termination.

```ts
import { connectAcp } from '@microsoft/flipcard-acp';

const client = await connectAcp({
  input: agentOutput,
  output: agentInput,
});
const session = await client.createSession({
  cwd: absoluteProjectDirectory,
  mcpServers: [],
});
const unsubscribe = session.subscribe((state, event) => {
  console.log(state, event);
});
await session.prompt('Describe this project.');
unsubscribe();
await session.dispose();
await client.dispose();
```

Here `agentOutput` and `agentInput` are host-supplied Web streams of `Uint8Array`,
and `absoluteProjectDirectory` is an absolute working directory. Call
`session.cancel()` while a prompt is running to send `session/cancel`; it waits
for the agent's prompt response. `client.dispose()` disconnects a stuck agent
connection but does not terminate the host-owned subprocess.

The client negotiates the protocol and streams bounded per-session updates. Tool permissions are denied
unless the host provides an `onPermission` callback that obtains explicit consent
and returns one of the agent's offered option IDs. It does not advertise
filesystem, terminal, session-restoration, or elicitation capabilities it has not
implemented. This is a client adapter, not an ACP agent or browser-to-stdio server.

### Microsoft Activity Protocol

`@microsoft/flipcard-activity` adapts
[Microsoft 365 Agents Activity Protocol](https://learn.microsoft.com/en-us/microsoft-365/agents-sdk/activity-protocol)
envelopes and actual Adaptive Card attachments:

```ts
import {
  activityToFlipCards,
  createFlipCardMessage,
} from '@microsoft/flipcard-activity';

const activity = createFlipCardMessage(
  {
    title: 'Status',
    schema: {
      type: 'AdaptiveCard',
      version: '1.5',
      body: [{ type: 'TextBlock', text: 'Ready to review' }],
    },
  },
  {
    channelId: 'example',
    conversation: { id: 'conversation-1' },
    from: { id: 'agent' },
    recipient: { id: 'user' },
  },
);
const { cards } = activityToFlipCards(activity);
```

Unknown protocol fields and unsupported attachments are preserved. Arbitrary
Flipcard schemas are never mislabeled as Adaptive Cards. The package also provides
explicit `adaptiveCard/action` invoke parsing, response bodies, and opt-in
dispatch; it does not fetch URLs or automatically execute actions. Channel
authentication, HTTP responses, Teams/Direct Line hosting, and host-specific
Adaptive Card feature support remain the integrating application's responsibility.

## Why FlipCard?

FlipCard is more than a component. It is the first primitive in a system where:

- system design is abstracted from skins without rewriting manifests
- schema can travel through frameworks and runtimes
- workflow can bind independently from rendering and platform
- entire surfaces can be composed from inspectable, portable UI cards
- adaptive agent flashcards and semantic schema index
- perfect for schema path pattern harvesting

## Atomic Design System

The design direction is an atomic hierarchy of schema-addressable, independently
themeable primitives. The table below describes that model, not a list of
currently exported components. Today's public rendering APIs are `FlipCard`,
`FlipCardCatalog`, and `createFlipCardElement`.

| Atomic Tier   | Primitive          | Role                                                                 |
| ------------- | ------------------ | -------------------------------------------------------------------- |
| Quark         | `tile-chip`        | Single-value badge (status, metric, tag) — the smallest renderable   |
| Atom          | `live-tile`        | Self-updating data tile (KPI, sparkline, status pane)                |
| Molecule      | `flip-card`        | Front/back schema-bound card — the canonical primitive               |
| Organism      | `card-shelf`       | Collection of flipcards with shared category, theme, and bindings    |
| Template      | `adaptive-surface` | Layout-aware composition (grid, stack, canvas, deck)                 |
| Page / App    | `adaptive-*`       | Full schema-driven application built from the tiers above            |

The naming convention is intentional and load-bearing: every primitive is `noun-noun` kebab-case, every app is `adaptive-<noun>`. Strong name associations let humans, agents, and schema indexers navigate the system identically.

## Adaptive Apps Marketplace

The marketplace direction is a collection of schema-driven applications that
can be inspected and remixed. `adaptive-slide` is vendored today; the other apps
below are planned, not installed or implemented packages.

| App                  | Status  | Source                                                          | Description                                                              |
| -------------------- | ------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `adaptive-slide`     | Vendored | [DarbotLM/adaptive-slide](https://github.com/DarbotLM/adaptive-slide) | Schema-driven presentation builder — decks of Adaptive Card slides       |
| `adaptive-note`      | Planned | TBD                                                             | Schema-driven note surface — markdown + tile blocks + bidirectional links |
| `adaptive-browser`   | Planned | TBD                                                             | Tabbed browser shell where each tab is a flipcard with schema-back       |
| `adaptive-terminal`  | Planned | TBD                                                             | PTY terminal as a livetile, with command history as schema records       |
| `adaptive-analytics` | Planned | TBD                                                             | Dashboard composed of livetiles bound to live data sources               |
| `adaptive-design`    | Planned | TBD                                                             | Design suite for authoring flipcard themes, tokens, and tile schemas     |

### First app: `adaptive-slide`

[`adaptive-slide/`](./adaptive-slide) is vendored into this monorepo as an adaptive
app example. Its deck/card/tile structure maps to the design model:

```text
Deck (adaptive-surface)
  └── Slide[]                    ← adaptive-surface in deck mode
       └── Adaptive Card Bucket  ← flip-card back manifest
            └── Tile[]           ← live-tile / tile-chip atoms
                 └── Tile Schema ← per-type JSON Schema 2020-12
```

Highlights:

- Decks are pure JSON, validated against `schemas/deck.schema.json`
- Tile types: `Tile.Text`, `Tile.Image`, `Tile.Code`, `Tile.Chart`, `Tile.Media`, `Tile.Container`
- Ships an MCP App plugin (`present-deck`, `list-slides`) for hosts supporting MCP Apps revision `2026-01-26`; other MCP hosts can consume tool text
- The self-contained MCP preview renders charts as tables and disables remote images; it is not the full presentation renderer
- Themes, transitions, and layout modes are schema-driven — no code changes required to restyle a deck

See [`adaptive-slide/README.md`](./adaptive-slide/README.md) for the full quickstart and [`adaptive-slide/examples/hello-world.deck.json`](./adaptive-slide/examples/hello-world.deck.json) for a working sample.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, stories, testing, and contribution guidance.

## License

MIT
