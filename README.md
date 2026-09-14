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

### React

```tsx
import { FlipCard } from '@microsoft/flipcard-react';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';

<FlipCard front={<div>Hello</div>} backJson={{ id: 'demo', schema: 'v0.1' }} category="teal" />;
```

### Vanilla Web Component

```html
<script type="module">
  import '@microsoft/flipcard/auto';
</script>
<flip-card category="teal" back-title="Manifest">
  <div>Hello</div>
</flip-card>
```

## Packages

| Package                      | Description                                  | npm                                                        |
| ---------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| `@microsoft/flipcard-core`   | Framework-agnostic types, schema, controller | <https://www.npmjs.com/package/@microsoft/flipcard-core>   |
| `@microsoft/flipcard-react`  | React component bindings                     | <https://www.npmjs.com/package/@microsoft/flipcard-react>  |
| `@microsoft/flipcard`        | Web Component `<flip-card>`                  | <https://www.npmjs.com/package/@microsoft/flipcard>        |
| `@microsoft/flipcard-themes` | CSS themes & tokens                          | <https://www.npmjs.com/package/@microsoft/flipcard-themes> |

## Architecture

```text
Q:\flipcard
├─ packages
│  ├─ core       -> schema, controller, types
│  ├─ react      -> React FlipCard + hook
│  ├─ vanilla    -> <flip-card> custom element
│  └─ themes     -> CSS themes and tokens
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
npm install
npm run dev          # FlipDeck (Vite dev server)
npm test
npm run build
```

## Why FlipCard?

FlipCard is more than a component. It is the first primitive in a system where:

- system design is abstracted from skins without rewriting manifests
- schema can travel through frameworks and runtimes
- workflow can bind independently from rendering and platform
- entire surfaces can be composed from inspectable, portable UI cards
- adaptive agent flashcards and semantic schema index
- perfect for schema path pattern harvesting

## Atomic Design System

FlipCard composes upward through a strict atomic hierarchy. Every layer is schema-addressable, every layer is independently themeable, and every layer carries the same `front / back / flip` contract.

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

FlipCard is the foundation of a community-driven marketplace of schema-driven applications. Each app is composed entirely from the atomic primitives above, ships its own manifest schema, and can be inspected, remixed, and extended through the same flip-to-back contract.

| App                  | Status  | Source                                                          | Description                                                              |
| -------------------- | ------- | --------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `adaptive-slide`     | Vendored | [DarbotLM/adaptive-slide](https://github.com/DarbotLM/adaptive-slide) | Schema-driven presentation builder — decks of Adaptive Card slides       |
| `adaptive-note`      | Planned | TBD                                                             | Schema-driven note surface — markdown + tile blocks + bidirectional links |
| `adaptive-browser`   | Planned | TBD                                                             | Tabbed browser shell where each tab is a flipcard with schema-back       |
| `adaptive-terminal`  | Planned | TBD                                                             | PTY terminal as a livetile, with command history as schema records       |
| `adaptive-analytics` | Planned | TBD                                                             | Dashboard composed of livetiles bound to live data sources               |
| `adaptive-design`    | Planned | TBD                                                             | Design suite for authoring flipcard themes, tokens, and tile schemas     |

### First app: `adaptive-slide`

[`adaptive-slide/`](./adaptive-slide) is vendored into this monorepo as the reference implementation of an adaptive app. It demonstrates the full atomic stack:

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
- Ships an MCP App plugin (`present-deck`, `list-slides`) so any MCP host (Claude Desktop, VS Code Copilot) can render decks in a sandboxed iframe
- Themes, transitions, and layout modes are schema-driven — no code changes required to restyle a deck

See [`adaptive-slide/README.md`](./adaptive-slide/README.md) for the full quickstart and [`adaptive-slide/examples/hello-world.deck.json`](./adaptive-slide/examples/hello-world.deck.json) for a working sample.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for local setup, stories, testing, and contribution guidance.

## License

MIT
