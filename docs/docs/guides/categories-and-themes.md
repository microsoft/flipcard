---
sidebar_position: 1
title: Categories & themes
---

# Categories & themes

Asset categories, MCP authoring presets, and themes are separate concepts.
Do not pass an MCP color preset as a React or vanilla asset category.

## Categories

Renderable asset categories are `kpi`, `status`, `profile`, `code`, `timeline`,
`faq`, `security`, `media`, `metric`, `chart`, `pattern`, `tile`, `portfolio`, and
`slide`. They select content designs; use `asset.category` and
`asset.manifest.design.kind`. The asset library's `flipCardCategoryLabels` and
`getFlipCardAssetsByCategory` use this set.

The MCP `list_categories` and `generate_manifest` tools instead expose seven
authoring presets. Their starter manifests use `design.category` and
`design.front`; these are not directly renderable assets:

| Category | Intent | Typical content |
|---|---|---|
| `teal` | Primary action cards for live content and launch points. | Dashboards, hero entry points, run‑this‑now flows. |
| `navy` | Reference cards for specifications, docs, and durable context. | Spec links, ADRs, reference tables. |
| `gold` | Highlight cards for featured content, wins, and callouts. | Launch announcements, awards, featured guides. |
| `green` | Healthy‑state cards for success metrics and positive status. | SLO greens, completed runs, positive trends. |
| `red` | Alert cards for urgent issues, risks, and destructive paths. | Incidents, risks, irreversible actions. |
| `plum` | Insight cards for analytics, experiments, and recommendations. | Experiment results, recommendations, what‑if cards. |
| `slate` | Neutral utility cards for system metadata and supporting details. | Build info, version metadata, neutral chrome. |

Programmatically:

```ts
import { CATEGORY_DESCRIPTIONS } from '@microsoft/flipcard-mcp';

CATEGORY_DESCRIPTIONS.forEach(({ category, description }) =>
  console.log(`${category}: ${description}`),
);
```

Or via the MCP `list_categories` tool when authoring with an agent.

## Themes

Themes change the surface palette. An asset may also specify an `accent`.

| Theme | When to use |
|---|---|
| `light` | Default, neutral background, blue accent. |
| `dark` | Inverse of light with brighter accent. |
| `midnight-sapphire` | Saturated dark theme with a gold secondary; designed for showcase / hero pages. |

Load the theme's exported stylesheet. Asset renderers select the class from
`asset.theme`; the helper also supports unthemed custom DOM:

```ts
import { getThemeClassName } from '@microsoft/flipcard';
import '@microsoft/flipcard-themes/midnight-sapphire.css';

document.body.classList.add(getThemeClassName('midnight-sapphire'));
```

## Picking the right combination

A few rules of thumb:

- Mix asset categories freely within a catalog.
- Use asset `theme` and `accent` for visual choices, not a color preset as the asset category.
- When using MCP starter manifests, map `design.front` to a renderer-specific
  `manifest.design` and wrap the result in an asset before rendering.
- Workflow descriptors never grant permission or execute actions automatically.

## See also

- **[`@microsoft/flipcard-themes`](../packages/themes)** — the design tokens.
- **[Authoring manifests](./authoring-manifests)** — how categories show up in the manifest.
