# @microsoft/flipcard-react

React components for FlipCard assets and reusable asset galleries.

## Build from source

From the repository root, use Node.js 22.18+ in 22.x, 24.11+ in 24.x, or 26+:

```bash
npm ci
npm run build:libs
```

Examples use local workspace packages, not an assumed npm publication. React
and React DOM peers support 18.3.1+ within 18.x or 19.x.

```tsx
import { FlipCard, FlipCardCatalog } from '@microsoft/flipcard-react';
import { flipCardAssetLibrary } from '@microsoft/flipcard';
import '@microsoft/flipcard/styles.css';
import '@microsoft/flipcard-themes/base.css';
import '@microsoft/flipcard-themes/light.css';
import '@microsoft/flipcard-themes/dark.css';
import '@microsoft/flipcard-themes/midnight-sapphire.css';

export function App() {
  const asset = flipCardAssetLibrary[0];
  return (
    <>
      {asset && <FlipCard asset={asset} onFlip={console.log} />}
      <FlipCardCatalog assets={flipCardAssetLibrary} />
    </>
  );
}
```

`FlipCard` accepts `asset`, `defaultState`, `interactive`, `className`, and
`onFlip`. `FlipCardCatalog` accepts `assets` and `className`. There is no controlled
`state`, `front`, or `backJson` prop. A core manifest alone is not an asset:
design content belongs in `asset.manifest.design` using `kind` and `headline`.
React and vanilla share asset data but do not guarantee identical rendering or
Adaptive Card support.