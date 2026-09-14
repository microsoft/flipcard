---
sidebar_position: 3
title: '@microsoft/flipcard-react'
---

# `@microsoft/flipcard-react`

React bindings for FlipCard. Ships two components — `<FlipCard>` for a single card and `<FlipCardCatalog>` for a grid — plus the renderable type definitions.

## Install

```bash
npm install @microsoft/flipcard-react @microsoft/flipcard-core @microsoft/flipcard-themes
```

> Requires React **≥ 18**.

## `<FlipCard>`

```tsx
import { FlipCard } from '@microsoft/flipcard-react';
import '@microsoft/flipcard-themes/styles/light.css';

<FlipCard
  asset={{
    id: 'welcome',
    category: 'teal',
    theme: 'light',
    design: { title: 'Hello FlipCard', summary: 'Click to flip.' },
    manifest: { id: 'welcome', title: 'Welcome' },
  }}
  defaultState="front"
  interactive
  onFlip={(state) => console.log(state)}
/>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `asset` | `FlipCardRenderableAsset` | Required. Combines design + manifest + category + theme. |
| `defaultState` | `'front' \| 'back'` | Initial face. Defaults to `'front'`. |
| `interactive` | `boolean` | Whether clicking the card flips it. Defaults to `true`. |
| `className` | `string` | Optional class merged onto the wrapper. |
| `onFlip` | `(state: FlipState) => void` | Fired whenever the face changes. |

The component renders an Adaptive Card surface on the front and a structured manifest view on the back, themed via the design tokens you import.

## `<FlipCardCatalog>`

A pre‑styled grid for browsing many cards at once.

```tsx
import { FlipCardCatalog } from '@microsoft/flipcard-react';

<FlipCardCatalog
  assets={[asset1, asset2, asset3]}
  className="my-catalog"
/>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `assets` | `FlipCardRenderableAsset[]` | The cards to render. |
| `className` | `string` | Optional wrapper class. |

## Types

```ts
import type {
  FlipCardAssetCategory,    // 'teal' | 'navy' | 'gold' | 'green' | 'red' | 'plum' | 'slate'
  FlipCardAssetTheme,       // 'light' | 'dark' | 'midnight-sapphire'
  FlipCardAssetDesign,
  FlipCardRenderableAsset,
  FlipCardRenderableManifest,
  FlipCardProps,
  FlipCardCatalogProps,
} from '@microsoft/flipcard-react';
```

## See also

- **[`@microsoft/flipcard-core`](./core)** — types and controller.
- **[Categories & themes](../guides/categories-and-themes)** — preset reference.
- The interactive **FlipDeck** gallery published at [microsoft.github.io/flipcard/flipdeck](https://microsoft.github.io/flipcard/flipdeck/).
