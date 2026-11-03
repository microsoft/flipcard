---
sidebar_position: 3
title: Core concepts
---

# Core concepts

FlipCard is built on five small ideas. Once you understand them you understand the system.

## 1. Manifest

A **manifest** is a JSON document that describes a card. Core manifests allow
opaque design and schema payloads. React and vanilla require a separate asset
wrapper with renderer-specific design fields; a valid core manifest alone does
not guarantee rendering.

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

Flipping toggles the face and is reversible, not idempotent. Explicitly setting
the same controller state is idempotent. React offers `onFlip`; the vanilla
button exposes its face through `data-state` and native click events.

## 3. Design ⟂ Schema ⟂ Workflow

The manifest separates the three things UI components usually fuse:

| Block | Owns | Examples |
|---|---|---|
| `design` | What the front face looks like. Opaque to the core — interpreted by the renderer. | `category`, `front.title`, `front.summary`, accent color |
| `schema` | The structured payload exposed on the back face. | `back.title`, `back.fields`, sample values |
| `workflow` | Events and actions the card binds to. | `onFlip` event name, telemetry actions, navigation actions |

This separation makes payloads portable, but not every renderer supports the
same designs. The `design.front` convention above is used by authoring tools;
the asset renderers expect `design.kind` and `design.headline`. Workflow entries
are declarative; hosts decide whether and how to execute them.

## 4. Controller

`FlipCardController` is the framework-agnostic state machine used by React and
available to custom consumers. The vanilla renderer manages its own button state:

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

Assets declare a **category**, such as `status`, `profile`, or `slide`, and a
**theme** (`light`, `dark`, `midnight-sapphire`). The MCP tools separately expose
seven color-based authoring presets (`teal`, `navy`, `gold`, `green`, `red`,
`plum`, `slate`); these are not valid asset categories. Import the corresponding
theme CSS as well as the renderer's structural stylesheet.

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

Renderers consume assets and their manifests. Themes supply the look. MCP lets
agents author JSON, ACP streams host-owned agent sessions, and Activity adapters
exchange channel envelopes. None of these layers automatically executes a
manifest's workflows.
