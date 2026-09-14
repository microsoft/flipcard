---
slug: /
sidebar_position: 1
title: Introduction
---

# Introduction

**FlipCard** is the first primitive in an adaptive, manifest schema‑driven, composable UI system. Every card has two faces:

- The **front** is a rendered design.
- The **back** is the manifest that produced it.

A click flips between them. The same manifest renders identically across React, vanilla web components, or any future renderer — because the manifest, not the component, is the source of truth.

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
| **Workflow** | Events and actions the card binds to. Owned by the manifest's `workflow` block. |

Because the manifest is just JSON validated against a published JSON Schema, it is portable, diff‑able, generatable by LLMs, and trivial to persist.

## What's in the box?

- **`@microsoft/flipcard-core`** — framework‑agnostic types, a tiny state‑machine controller, the manifest JSON Schema, and a lightweight runtime validator.
- **`@microsoft/flipcard-themes`** — shared design tokens (light, dark, midnight‑sapphire) consumed by every renderer.
- **`@microsoft/flipcard-react`** — React components: `<FlipCard>` and `<FlipCardCatalog>`.
- **`@microsoft/flipcard`** — framework‑neutral `<flip-card>` web component plus a curated asset library.
- **`@microsoft/flipcard-mcp`** — Model Context Protocol server that exposes manifest tooling to LLM agents.

## Where to go next

- **[Getting started](./getting-started)** — install a package and render your first card.
- **[Core concepts](./concepts)** — manifest, design, schema, workflow, controller.
- **[Categories & themes](./guides/categories-and-themes)** — visual presets that ship with the system.
- **[MCP server](./packages/mcp-server)** — let agents list categories, validate manifests, and generate starter cards.
- **[Manifest reference](./reference/manifest)** — the full JSON Schema.
