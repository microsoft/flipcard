---
sidebar_position: 2
title: '@microsoft/flipcard-themes'
---

# `@microsoft/flipcard-themes`

Shared design tokens for every FlipCard renderer. Ships TypeScript token objects you can consume from CSS‑in‑JS, design tools, or the FlipDeck gallery, plus the underlying CSS custom properties that power the renderers' default styling.

## Install

```bash
npm install @microsoft/flipcard-themes
```

## Tokens

```ts
import { lightTokens, darkTokens, midnightSapphireTokens, type FlipCardTokens } from '@microsoft/flipcard-themes';

lightTokens.accent;             // '#2563eb'
darkTokens.surface;             // '#15181d'
midnightSapphireTokens.bg;      // '#060a18'
```

Each token set is the same shape — typed as `FlipCardTokens` — so you can swap themes by reference.

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

The package ships matching CSS files under `styles/` that map every token to a CSS custom property the renderers read. Import the one you want:

```ts
import '@microsoft/flipcard-themes/styles/light.css';
import '@microsoft/flipcard-themes/styles/dark.css';
import '@microsoft/flipcard-themes/styles/midnight-sapphire.css';
```

Or scope a theme to a subtree by setting the appropriate class on a wrapper element — see the `getThemeClassName` helper in **[`@microsoft/flipcard` (vanilla)](./vanilla)**.

## Customising

Because the tokens are plain objects you can:

- Spread them to derive a brand variant (`{ ...lightTokens, accent: '#ff6a00' }`).
- Feed them into a design tool exporter.
- Override the underlying CSS variables for a slice of the page.

## See also

- **[Categories & themes](../guides/categories-and-themes)** — semantic categories, not just colors.
