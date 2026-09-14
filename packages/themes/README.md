# @microsoft/flipcard-themes

CSS themes and design tokens for [FlipCard](https://github.com/microsoft/flipcard).

This package ships:

- **`base.css`** — structural styles for the `.flip-card` / `.flip-inner` / `.flip-front` / `.flip-back` 3D primitive. Driven entirely by `--fc-*` custom properties.
- **`light.css`** / **`dark.css`** — neutral light and dark themes.
- **`midnight-sapphire.css`** — a premium dark theme with deep navy and sapphire-gold accents.
- **`tokens`** — the same design tokens exported as TypeScript objects for CSS-in-JS or design-tool consumers.

## Install

```sh
npm install @microsoft/flipcard-themes
```

## Usage

Import the base CSS plus one or more themes:

```ts
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';
```

Apply a theme by adding the matching class to any ancestor (`html`, `body`, or a subtree):

```html
<body class="fc-theme-midnight-sapphire">
  <flip-card>…</flip-card>
</body>
```

`light.css` also applies to bare `:root`, and `dark.css` opts in automatically under `prefers-color-scheme: dark` unless `.fc-theme-light` is set.

## Tokens

```ts
import { lightTokens, darkTokens, midnightSapphireTokens } from '@microsoft/flipcard-themes';
```

## License

MIT
