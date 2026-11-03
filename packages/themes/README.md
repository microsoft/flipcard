# @microsoft/flipcard-themes

CSS themes and design tokens for [FlipCard](https://github.com/microsoft/flipcard).

This package ships:

- **`base.css`** — structural styles for the `.flip-card` / `.flip-inner` / `.flip-front` / `.flip-back` 3D primitive. Driven entirely by `--fc-*` custom properties.
- **`light.css`** / **`dark.css`** — neutral light and dark themes.
- **`midnight-sapphire.css`** — a premium dark theme with deep navy and sapphire-gold accents.
- **`tokens`** — the same design tokens exported as TypeScript objects for CSS-in-JS or design-tool consumers.

## Build from source

From the repository root, use Node.js 22.18+ in 22.x, 24.11+ in 24.x, or 26+:

```sh
npm ci
npm run build:libs
```

These are workspace imports; an npm publication is not assumed.

## Usage

Import the base CSS plus one or more themes:

```ts
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';
```

Asset renderers also require `import '@microsoft/flipcard/styles.css'`.

Apply a theme by adding the matching class to any ancestor (`html`, `body`, or a subtree):

```html
<body class="fc-theme-midnight-sapphire">
  <div id="cards"></div>
</body>
```

Both asset renderers put a theme class on the card from `asset.theme`; choose
that field rather than relying solely on an ancestor class. `light.css` provides
root defaults. `dark.css` applies automatic dark root tokens under
`prefers-color-scheme: dark` unless the root has `fc-theme-light`; this does not
override a card's explicitly selected theme.

## Tokens

```ts
import { lightTokens, darkTokens, midnightSapphireTokens } from '@microsoft/flipcard-themes';
```

## License

MIT
