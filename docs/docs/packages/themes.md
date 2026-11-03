---
sidebar_position: 2
title: '@microsoft/flipcard-themes'
---

# `@microsoft/flipcard-themes`

Shared design tokens for every FlipCard renderer. Ships TypeScript token objects you can consume from CSS‑in‑JS, design tools, or the FlipDeck gallery, plus the underlying CSS custom properties that power the renderers' default styling.

## Install

Build the [local source](../getting-started.md) with `npm ci` and `npm run build`
at the repository root; the workspace resolves this package.

## Tokens

```ts
import { lightTokens, darkTokens, midnightSapphireTokens, type FlipCardTokens } from '@microsoft/flipcard-themes';

lightTokens.accent;             // '#2563eb'
darkTokens.surface;             // '#15181d'
midnightSapphireTokens.bg;      // '#060a18'
```

The token objects have matching keys. The exported `FlipCardTokens` type is
currently `typeof lightTokens`, including its literal values; it is not a
widened type accepting every theme or custom palette. Derive a widened type
such as `{ [K in keyof typeof lightTokens]: string }` when needed.

| Token | Purpose |
|---|---|
| `bg` | Page background behind cards. |
| `surface` | Front‑face surface color. |
| `text` / `textDim` | Primary and secondary text. |
| `border` | Front‑face border. |
| `accent` | Brand accent for category indicators. |
| `radius` | Card corner radius. |
| `shadow` | Card elevation. |
| `backBg` / `backText` / `backBorder` | Back‑face equivalents. |

## Themes shipped

| Theme | When to use |
|---|---|
| `lightTokens` | Default light surface, blue accent. |
| `darkTokens` | Inverse with desaturated text and a brighter accent. |
| `midnightSapphireTokens` | Saturated dark theme with a gold secondary; designed for showcase / hero usage. |

## CSS

Use the public CSS subpaths below, not `/styles/light.css` or a `/tokens` import.
Load structural and asset styling alongside the desired themes:

```ts
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';
```

The classes are `fc-theme-light`, `fc-theme-dark`, and
`fc-theme-midnight-sapphire`. Asset renderers set a class on each card from
`asset.theme`, so changing an ancestor does not override an explicitly themed
card. `light.css` also styles `:root`; `dark.css` supplies an automatic dark-mode
root unless the root has `fc-theme-light`. See `getThemeClassName` in
**[`@microsoft/flipcard` (vanilla)](./vanilla.md)**.

## Customising

Because the tokens are plain objects you can:

- Spread them to derive a brand variant (`{ ...lightTokens, accent: '#ff6a00' }`).
- Feed them into a design tool exporter.
- Override the underlying CSS variables for a slice of the page.

## See also

- **[Categories & themes](../guides/categories-and-themes)** — semantic categories, not just colors.
