---
sidebar_position: 4
title: '@microsoft/flipcard (vanilla)'
---

# `@microsoft/flipcard`

Framework‑neutral renderer. Registers a `<flip-card>` Web Component you can drop into any HTML page, plus a curated **asset library** of sample manifests and helpers for server‑side or non‑React rendering.

## Install

```bash
npm install @microsoft/flipcard @microsoft/flipcard-core @microsoft/flipcard-themes
```

## Define the element

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

### Attributes

| Attribute | Description |
|---|---|
| `front-title` | Title shown on the front face. |
| `back-title` | Title shown on the back face. |
| `flip-hint` | Optional hint text rendered as an affordance. |
| `default-flipped` | If present, the card starts on the back face. |
| `show-flip-hint` | Toggle the visible flip affordance. |
| `schema` | JSON string for the back‑face structured payload. |
| `manifest` | JSON string for a full `FlipCardManifest`. |

### Events

| Event | Detail | Fired when |
|---|---|---|
| `flipcard:flip` | `{ flipped: boolean }` | The card flips (front ↔ back). |
| `flipcard:copy` | `{ text: string }` | A "copy schema" action is invoked. |

## Asset library

The package also ships a small library of curated, themed assets you can iterate over:

```ts
import {
  flipCardAssetLibrary,
  flipCardCategoryLabels,
  getFlipCardAssetById,
  getFlipCardAssetsByCategory,
  groupFlipCardAssetsByCategory,
} from '@microsoft/flipcard';

const tealCards = getFlipCardAssetsByCategory('teal');
const grouped = groupFlipCardAssetsByCategory();
```

Useful for showcase pages, the FlipDeck gallery, and auto‑generated catalog grids.

## Render helpers (server / non‑custom‑element)

```ts
import { createFlipCardElement, getThemeClassName, serializeManifest } from '@microsoft/flipcard';

const el = createFlipCardElement({ /* options */ });
document.body.appendChild(el);

const className = getThemeClassName('midnight-sapphire');
const json = serializeManifest({ id: 'demo', title: 'Hello' });
```

## See also

- **[`@microsoft/flipcard-core`](./core)** — types and schema.
- **[Authoring manifests](../guides/authoring-manifests)** — patterns for hand‑written cards.
