---
sidebar_position: 1
title: Categories & themes
---

# Categories & themes

FlipCards declare two visual axes: a **category** (semantic intent and accent palette) and a **theme** (light/dark surface family).

## Categories

Seven presets ship with the system. Pick the one whose intent matches the content — not just the color you want.

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

Themes change the surrounding surface palette while categories keep their semantic accent.

| Theme | When to use |
|---|---|
| `light` | Default, neutral background, blue accent. |
| `dark` | Inverse of light with brighter accent. |
| `midnight-sapphire` | Saturated dark theme with a gold secondary; designed for showcase / hero pages. |

Apply a theme by importing its CSS or by setting the corresponding class on a wrapper:

```ts
import { getThemeClassName } from '@microsoft/flipcard';

document.body.classList.add(getThemeClassName('midnight-sapphire'));
```

## Picking the right combination

A few rules of thumb:

- Mix categories freely within a single grid — that's what the catalog is for.
- Don't change category to mean "I want red instead of teal." Use category to communicate **intent**; use theme + token overrides for color preferences.
- Use `gold` and `red` sparingly so they keep their salience.
- Reserve `slate` for chrome that should fade into the background.

## See also

- **[`@microsoft/flipcard-themes`](../packages/themes)** — the design tokens.
- **[Authoring manifests](./authoring-manifests)** — how categories show up in the manifest.
