---
sidebar_position: 4
title: '@microsoft/flipcard (vanilla)'
---

# `@microsoft/flipcard`

Framework-neutral DOM renderer and curated **asset library**. The public
`createFlipCardElement(asset, options)` function returns an `HTMLButtonElement`.
It needs a browser DOM; it is not a server-side renderer or a registered
`<flip-card>` custom element.

## Install

Follow [local-source setup](../getting-started.md): `npm ci` then `npm run build`
at the repository root. Do not assume a published npm package.

## Create the element

```ts
import { createFlipCardElement, flipCardAssetLibrary } from '@microsoft/flipcard';
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';

const asset = flipCardAssetLibrary[0];
if (asset) {
  const card = createFlipCardElement(asset, {
    defaultState: 'front',
    interactive: true,
  });
  card.addEventListener('click', () => console.log(card.dataset.state));
  document.body.append(card);
}
```

### Inputs and state

| Input | Description |
|---|---|
| `asset` | Required `FlipCardAssetEntry`, including `manifest.design`, `manifest.schema`, and `manifest.metadata`. |
| `options.defaultState` | `'front'` (default) or `'back'`. |
| `options.interactive` | Defaults to `true`; `false` disables the button. |

The button exposes its current face through `data-state` and `aria-pressed`.
The back serializes the whole manifest. There are no manifest/schema properties,
custom attributes, `defineFlipCard` function, or `/auto` export.

### Events

Use the native `click` event. The internal listener flips first, so a listener
attached after creation can read `card.dataset.state`. The renderer does not
dispatch `flipcard:flip` or `flipcard:copy` custom events.

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

const statusCards = getFlipCardAssetsByCategory('status');
const grouped = groupFlipCardAssetsByCategory();
```

Useful for showcase pages, the FlipDeck gallery, and auto‑generated catalog grids.

## Render helpers

```ts
import { flipCardAssetLibrary, getThemeClassName, serializeManifest } from '@microsoft/flipcard';

const className = getThemeClassName('midnight-sapphire');
const asset = flipCardAssetLibrary[0];
const json = asset ? serializeManifest(asset.manifest) : undefined;
```

`getThemeClassName` and `serializeManifest` do not require a DOM.
`createFlipCardElement` does. The asset-only entry point
`@microsoft/flipcard/assets` is also exported.

## See also

- **[`@microsoft/flipcard-core`](./core)** — types and schema.
- **[Authoring manifests](../guides/authoring-manifests)** — patterns for hand‑written cards.
