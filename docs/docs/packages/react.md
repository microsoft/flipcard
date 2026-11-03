---
sidebar_position: 3
title: '@microsoft/flipcard-react'
---

# `@microsoft/flipcard-react`

React bindings for FlipCard. Ships two components — `<FlipCard>` for a single card and `<FlipCardCatalog>` for a grid — plus the renderable type definitions.

## Install

Follow [local-source setup](../getting-started.md): `npm ci` then `npm run build`
at the repository root. The examples use workspace imports, not an assumed npm
publication. Peer dependencies support React and React DOM **18.3.1+ in 18.x or 19.x**.

## `<FlipCard>`

```tsx
import { FlipCard } from '@microsoft/flipcard-react';
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';

<FlipCard
  asset={{
    id: 'welcome',
    category: 'status',
    title: 'Welcome',
    summary: 'Click to flip.',
    theme: 'light',
    manifest: {
      id: 'welcome',
      title: 'Welcome',
      design: { kind: 'status', headline: 'Hello FlipCard', summary: 'Click to flip.' },
      schema: { status: 'ready' },
    },
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

The component renders category-specific design content, including an Adaptive
Card surface for supported slide assets, and the serialized manifest on the
back. Design belongs in `asset.manifest.design`. It does not accept `front`,
`backJson`, a controlled `state`, or a top-level `category` prop. Use the asset's
`theme` and import the corresponding exported theme stylesheet.

## `<FlipCardCatalog>`

A pre‑styled grid for browsing many cards at once.

```tsx
import { FlipCardCatalog } from '@microsoft/flipcard-react';
import { flipCardAssetLibrary } from '@microsoft/flipcard';

<FlipCardCatalog
  assets={flipCardAssetLibrary}
  className="my-catalog"
/>
```

### Props

| Prop | Type | Description |
|---|---|---|
| `assets` | `readonly FlipCardRenderableAsset[]` | The cards to render. |
| `className` | `string` | Optional wrapper class. |

## Types

```ts
import type {
  FlipCardAssetCategory,    // 'kpi' | 'status' | 'profile' | ... (not MCP color presets)
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
