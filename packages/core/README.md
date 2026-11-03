# @microsoft/flipcard-core

Framework-agnostic core for [FlipCard](https://github.com/microsoft/flipcard) — the first primitive in an adaptive, manifest schema-driven, composable UI system.

This package contains:

- **Types** — `FlipState`, `FlipCardManifest`, `FlipCardWorkflow`, `FlipCardOptions`.
- **Controller** — a tiny state machine (`FlipCardController`) used by React and available to custom consumers; vanilla manages its own DOM button state.
- **Schema** — the JSON Schema (draft-07) for the FlipCard manifest, plus a lightweight runtime validator.
- **Stock quote helpers** — `parseStockQuote`, `createStockQuoteClient`,
  `hydrateStockQuoteCard`, interval/staleness constants, and quote/state/options
  types. These require an explicitly configured public endpoint; they do not
  ship a provider, API key, or invented price fallback.

## Build from source

From the repository root, using Node.js 22.18+ in 22.x, 24.11+ in 24.x, or 26+:

```sh
npm ci
npm run build:libs
```

Examples use workspace imports, not an assumed npm publication. TypeScript 7
builds the libraries.

## Usage

```ts
import { FlipCardController, validateManifest } from '@microsoft/flipcard-core';

const controller = new FlipCardController({
  defaultState: 'front',
  onChange: (state) => console.log('flipped to', state),
});

controller.flip(); // 'back'

const result = validateManifest({ id: 'demo', title: 'Hello' });
console.log(result.valid); // true
```

`validateManifest` is a narrow shape check, not full draft-07 validation.
It does not certify renderer assets, validate arbitrary design/schema payloads,
or authorize workflow actions. Use `flipCardManifestSchema` with a draft-07
validator and application-specific checks for stronger guarantees.
`flip()` toggles; `set(state)` is idempotent and only notifies on changes.

Stock clients expose `start`, `stop`, `refresh`, and `offline`. Defaults are
five-minute polling, a ten-second request timeout, and a 36-hour stale threshold
based on the provider's market timestamp. Browser visibility/offline listeners
belong to the host (implemented in the showcase hook).
See [stock quote setup](../../docs/docs/getting-started.md#stock-quote-card) for
the MSFT/USD JSON contract and endpoint/CORS/licensing restrictions.

## Vision

FlipCard decouples **design ⟂ schema ⟂ workflow**. The front face is the rendered design, the back face is the manifest schema, and a click flips between them. This package provides the schema and state primitives that all renderers share.

## License

MIT
