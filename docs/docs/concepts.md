---
sidebar_position: 3
title: Core concepts
---

# Core concepts

FlipCard is built on five small ideas. Once you understand them you understand the system.

## 1. Manifest

A **manifest** is a JSON document that describes a single card. It is the source of truth — every renderer derives its output from it, and every authoring tool (including LLM agents) produces or transforms it.

```jsonc
{
  "$schema": "https://microsoft.github.io/flipcard/schema/v0.1.json",
  "version": "0.1.0",
  "id": "welcome",
  "title": "Welcome card",
  "design": { "category": "teal", "front": { "title": "Hello", "summary": "Click to flip." } },
  "schema": { "back": { "title": "Welcome", "fields": [] } },
  "workflow": { "onFlip": "flipcard.flip", "actions": [] },
  "metadata": { "owner": "ux-team" }
}
```

The full shape is documented in **[reference/manifest](./reference/manifest)**.

## 2. Front, back, and the flip

Every card has two faces:

- **Front** — the rendered design. Whatever the renderer chooses to show.
- **Back** — typically a structured view of the manifest's `schema` block (a "what produced this?" panel).

Flipping is reversible, idempotent, and fires a state‑change event so consumers can react.

## 3. Design ⟂ Schema ⟂ Workflow

The manifest separates the three things UI components usually fuse:

| Block | Owns | Examples |
|---|---|---|
| `design` | What the front face looks like. Opaque to the core — interpreted by the renderer. | `category`, `front.title`, `front.summary`, accent color |
| `schema` | The structured payload exposed on the back face. | `back.title`, `back.fields`, sample values |
| `workflow` | Events and actions the card binds to. | `onFlip` event name, telemetry actions, navigation actions |

This separation is what lets the same manifest render in React, vanilla, or a future renderer without changes.

## 4. Controller

`FlipCardController` is a tiny framework‑agnostic state machine that every renderer uses internally:

```ts
import { FlipCardController } from '@microsoft/flipcard-core';

const c = new FlipCardController({ defaultState: 'front' });
c.state;             // 'front'
c.flip();            // 'back'
c.set('front');      // 'front'
c.subscribe((s) => console.log(s));
```

It has no DOM, no React, no dependencies. You can use it to drive non‑visual flip behavior (flashcards, A/B states, multi‑face widgets) without ever importing a renderer.

## 5. Categories and themes

Cards declare a **category** (one of seven semantic presets) and a **theme** (light, dark, midnight‑sapphire). Categories convey intent and pick an accent palette; themes pick the surrounding light/dark surfaces. Both are tokenised so designers can extend them without touching renderers.

See **[Categories & themes](./guides/categories-and-themes)** for the full preset list.

---

### Mental model

```
                 ┌─────────────┐
                 │  Manifest   │  (JSON, validated against schema)
                 └──────┬──────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
     ┌───▼───┐     ┌────▼────┐    ┌────▼────┐
     │ design│     │  schema │    │workflow │
     └───┬───┘     └────┬────┘    └────┬────┘
         │              │              │
   front face       back face      events / actions
```

Renderers (React, vanilla) walk the manifest. The controller manages the flip. Themes supply the look. The MCP server lets agents author the whole thing.
