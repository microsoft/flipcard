# @microsoft/flipcard

Framework-neutral DOM renderer and curated asset library for FlipCard.
`createFlipCardElement` returns an `HTMLButtonElement`, not a custom element.

## Build from source

From the repository root, use Node.js 22.18+ in 22.x, 24.11+ in 24.x, or 26+:

```sh
npm ci
npm run build:libs
```

These examples use local workspace packages, not an assumed npm publication.

## Usage

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

The required `FlipCardAssetEntry` wraps a manifest with `design`, `schema`, and
`metadata`. `defaultState` is `'front'` or `'back'`; `interactive: false` disables
the button. The current face appears in `data-state` and `aria-pressed`.
The back serializes the whole manifest.

There are no `manifest`/`schema` element properties, `/auto` export, custom-element
registration, or custom flip/copy events. Use native click events after creation.
`createFlipCardElement` requires a DOM; asset lookup helpers, `getThemeClassName`,
and `serializeManifest` do not.

## License

MIT
