---
sidebar_position: 2
title: Architecture
---

# Architecture

FlipCard is a small, layered system. The same manifest flows through every layer; the layers are swappable.

```
┌────────────────────────────────────────────────────────┐
│                        Manifest                        │  JSON, validated against
└──────────────────────────┬─────────────────────────────┘  the published schema
                           │
       ┌───────────────────┼───────────────────────────┐
       │                   │                           │
       ▼                   ▼                           ▼
   design{}            schema{}                    workflow{}
   (front face)        (back face)                 (events / actions)
       │                   │                           │
       └─────────┬─────────┘                           │
                 ▼                                     ▼
        FlipCardController              host application / telemetry
        (state machine)
                 │
   ┌─────────────┼─────────────┐
   ▼             ▼             ▼
 React       Vanilla       (future)
 renderer    custom        renderers
              element
   │             │
   └──────┬──────┘
          ▼
   @microsoft/flipcard-themes
   (design tokens + CSS)
```

## Packages and their dependencies

```
@microsoft/flipcard-core            (no deps)
   ▲
   ├── @microsoft/flipcard-react    (React 18+)
   ├── @microsoft/flipcard          (web component)
   └── @microsoft/flipcard-mcp      (@modelcontextprotocol/sdk, zod)

@microsoft/flipcard-themes          (no deps; consumed by both renderers)
```

- `@microsoft/flipcard-core` is the only required dependency. Everything else builds on top of it.
- `@microsoft/flipcard-themes` is decoupled from `core` so non‑visual consumers (the controller, the MCP server) don't need to pull CSS.
- The MCP server depends on `core` for the schema and validator — so an LLM that uses it cannot diverge from what the renderers accept.

## Build & deploy pipeline

- **Library builds** use [`tsup`](https://tsup.egoist.dev/) per package.
- **FlipDeck** is a Vite + React gallery at `apps/showcase` that dogfoods `FlipCardCatalog` and the `flipCardAssetLibrary`.
- **Docs** are this Docusaurus site at `docs/`.
- **GitHub Pages** deploys via `.github/workflows/deploy.yml`:
  - `/` — this documentation site
  - `/flipdeck/` — the FlipDeck gallery (canonical URL)
  - `/showcase/` — the same FlipDeck build, kept for backward compatibility
  - `/schema/v0.1.json` — the published manifest schema

The same manifest, validated by the same schema, is what every layer agrees on. That is the point of the system.
