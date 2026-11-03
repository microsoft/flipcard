---
sidebar_position: 2
title: Architecture
---

# Architecture

FlipCard separates core manifest data, asset rendering, and protocol adapters.
These layers share types where appropriate, not a universal rendering contract.

```
┌────────────────────────────────────────────────────────┐
│                        Manifest                        │  Portable JSON;
└──────────────────────────┬─────────────────────────────┘  opaque payloads
                           │
       ┌───────────────────┼───────────────────────────┐
       │                   │                           │
       ▼                   ▼                           ▼
   design{}            schema{}                    workflow{}
   (front face)        (back face)                 (events / actions)
       │                   │                           │
       └─────────┬─────────┘                           │
                 ▼                                     ▼
        Renderable asset                host application / telemetry
        (adapt to renderer)
                 │
   ┌─────────────┼─────────────┐
   ▼             ▼             ▼
 React       Vanilla       (future)
 renderer    DOM button    renderers
   │             │
   └──────┬──────┘
          ▼
   @microsoft/flipcard-themes
   (design tokens + CSS)
```

## Packages and their dependencies

```
@microsoft/flipcard-core            (no runtime deps)
   ▲
   ├── @microsoft/flipcard-react    (React 18.3.1+ in 18.x, or 19.x)
   ├── @microsoft/flipcard          (DOM renderer + assets)
   ├── @microsoft/flipcard-activity (Activity / Adaptive Card adapters)
   └── @microsoft/flipcard-mcp      (split MCP SDK + Apps SDK, zod)

@microsoft/flipcard-themes          (no deps; consumed by both renderers)
@microsoft/flipcard-acp             (@agentclientprotocol/sdk 2.0.2)
```

- Core defines the broad manifest type, draft-07 schema, controller, and narrow
  runtime shape check. It is not a complete schema validation engine.
- `@microsoft/flipcard-themes` is decoupled from `core` so non‑visual consumers (the controller, the MCP server) don't need to pull CSS.
- MCP depends on core for its schema and validator. That does not enforce the
  renderer-specific asset types or validate arbitrary design/schema payloads.
- React uses the core controller; vanilla maintains its own DOM button state.
  Their rendering and Adaptive Card support differ.

## Protocol boundaries

| Integration | Implemented contract | Host responsibilities |
|---|---|---|
| MCP | 2026-07-28, split SDK 2.4; stdio default, stateless localhost HTTP with 2025-11-25 fallback | Client configuration and tool consent; remote auth is not provided |
| MCP Apps | 2026-01-26, ext-apps 2.0.4; inline viewer and host-mediated tools | Sandbox/CSP enforcement and Apps support |
| ACP | v1, SDK 2.0.2; injected NDJSON streams, sessions, cancellation, bounded updates | Agent process, authentication, explicit permission UI; no filesystem/terminal/elicitation implementation |
| Microsoft Activity | Envelopes, Adaptive Card attachments, explicit invoke parsing/dispatch | Channel hosting/authentication, HTTP response mapping, action authorization |
| Agent Plugins | 1.0.0 root `plugin.json` and `mcp.json` | Local source build and compatible plugin host; normal permissions remain in force |

See [agent authoring](../guides/agent-authoring.md) and the
[MCP package guide](../packages/mcp-server.md) for executable examples.

## Build & deploy pipeline

- **Library builds** use [`tsup`](https://tsup.egoist.dev/) for bundles and
  TypeScript **7** for declarations. TypeScript **6** is isolated in lint tooling
  for parser compatibility, not application compilation.
- **FlipDeck** is a Vite + React gallery at `apps/showcase` that dogfoods `FlipCardCatalog` and the `flipCardAssetLibrary`.
- **Docs** are this Docusaurus site at `docs/`.
- **GitHub Pages** deploys via `.github/workflows/deploy.yml`:
  - `/` — this documentation site
  - `/flipdeck/` — the FlipDeck gallery (canonical URL)
  - `/showcase/` — the same FlipDeck build, kept for backward compatibility
  - `/schema/v0.1.json` — the published manifest schema

Set repository **Settings → Pages → Source** to **GitHub Actions**. Branch-based
Jekyll publishing does not build this Docusaurus site. The workflow composes
these paths beneath the project's `/flipcard/` base URL. A local docs build does
not prove that repository Pages settings or the hosted deployment are correct.
