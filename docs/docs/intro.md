---
slug: /
sidebar_position: 1
title: Introduction
---

# Introduction

**FlipCard** is the first primitive in an adaptive, manifest schema‑driven, composable UI system. Every card has two faces:

- The **front** is a rendered design.
- The **back** is the manifest that produced it.

A click flips between them. React and the vanilla DOM renderer share asset data
and core types, but their rendering and supported features differ. A valid core
manifest alone is not a complete renderable asset.

## What problem does it solve?

UI components usually fuse three concerns:

1. **How they look** — markup, styles, animation.
2. **What data they expect** — the prop or payload shape.
3. **What they do** — events, telemetry, side effects.

That fusion makes UIs hard to compose, hard to validate, hard to generate, and hard to evolve. FlipCard separates them:

| Layer | What it owns |
|---|---|
| **Design** | Visual rendering of the front face. Owned by the renderer + theme tokens. |
| **Schema** | The manifest payload that describes the card. Owned by `@microsoft/flipcard-core`. |
| **Workflow** | Declarative events and actions in `workflow`; execution belongs to the host application. |

The manifest is portable JSON with a published JSON Schema. The runtime validator
only checks a small subset of that schema; it does not certify renderer compatibility.

## What's in the box?

- **`@microsoft/flipcard-core`** — framework‑agnostic types, a tiny state‑machine controller, the manifest JSON Schema, and a lightweight runtime validator.
- **`@microsoft/flipcard-themes`** — shared design tokens (light, dark, midnight‑sapphire) consumed by every renderer.
- **`@microsoft/flipcard-react`** — React components: `<FlipCard>` and `<FlipCardCatalog>`.
- **`@microsoft/flipcard`** — framework-neutral DOM button renderer and curated asset library; no custom-element registration.
- **`@microsoft/flipcard-mcp`** — MCP `2026-07-28` tooling and a self-contained MCP Apps `2026-01-26` viewer.
- **`@microsoft/flipcard-acp`** — stream-injected ACP v1 client for host-owned agent sessions.
- **`@microsoft/flipcard-activity`** — transport-free Microsoft Activity envelope, Adaptive Card, and invoke helpers.

## Where to go next

- **[Getting started](./getting-started.md)** — build the local source and render your first card.
- **[Core concepts](./concepts.md)** — manifest, design, schema, workflow, controller.
- **[Categories & themes](./guides/categories-and-themes.md)** — asset categories versus authoring presets.
- **[MCP server](./packages/mcp-server.md)** — transports, tools, resources, and MCP Apps.
- **[Agent authoring](./guides/agent-authoring.md)** — Agent Plugins 1.0, ACP, and Activity integration.
- **[Manifest reference](./reference/manifest.md)** — schema and validator boundaries.
