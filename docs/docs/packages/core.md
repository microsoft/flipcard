---
sidebar_position: 1
title: '@microsoft/flipcard-core'
---

# `@microsoft/flipcard-core`

Framework‑agnostic foundation for FlipCard. Contains the manifest types, the state‑machine controller, the JSON Schema, and a lightweight runtime validator. **No DOM. No framework. No deps.**

## Install

Build the [local source](../getting-started.md) with `npm ci` and `npm run build`
at the repository root. This guide does not assume an npm publication.

## Exports

```ts
export type { FlipState, FlipCardManifest, FlipCardWorkflow, FlipCardOptions } from '@microsoft/flipcard-core';
export { FlipCardController, FLIPCARD_SCHEMA_URL, flipCardManifestSchema, validateManifest } from '@microsoft/flipcard-core';
export {
  createStockQuoteClient,
  hydrateStockQuoteCard,
  parseStockQuote,
  STOCK_QUOTE_INTERVAL_MS,
  STOCK_QUOTE_STALE_MS,
} from '@microsoft/flipcard-core';
export type {
  StockQuote,
  StockQuoteStatus,
  StockQuoteState,
  StockQuoteClientOptions,
} from '@microsoft/flipcard-core';
```

## Types

### `FlipState`

```ts
type FlipState = 'front' | 'back';
```

### `FlipCardManifest`

```ts
interface FlipCardManifest {
  $schema?: string;       // points to https://microsoft.github.io/flipcard/schema/v0.1.json
  version?: string;       // manifest semver
  id?: string;
  title?: string;
  design?: unknown;       // opaque to core; interpreted by renderer
  schema?: unknown;       // structured payload, usually shown on the back face
  workflow?: FlipCardWorkflow;
  metadata?: Record<string, unknown>;
}
```

### `FlipCardWorkflow`

```ts
interface FlipCardWorkflow {
  onFlip?: string;
  actions?: Array<{ id: string; type: string; data?: unknown }>;
}
```

### `FlipCardOptions`

```ts
interface FlipCardOptions {
  defaultState?: FlipState;
  onChange?: (state: FlipState) => void;
}
```

## `FlipCardController`

A tiny state machine used by React and available to custom consumers. Vanilla
maintains its own DOM button state.

```ts
import { FlipCardController } from '@microsoft/flipcard-core';

const c = new FlipCardController({
  defaultState: 'front',
  onChange: (state) => console.log('changed to', state),
});

c.state;                         // 'front'
c.flip();                        // toggles → 'back'
c.set('front');                  // explicit set
const off = c.subscribe((s) => console.log(s));
off();                           // unsubscribe
```

| Member | Description |
|---|---|
| `state` | Current `FlipState`. |
| `flip()` | Toggle between front and back. Returns the new state. |
| `set(state)` | Explicitly set the state. Idempotent — no event if unchanged. |
| `subscribe(listener)` | Add a listener. Returns an unsubscribe function. |

## Schema helpers

```ts
import { FLIPCARD_SCHEMA_URL, flipCardManifestSchema, validateManifest } from '@microsoft/flipcard-core';

FLIPCARD_SCHEMA_URL;
// → 'https://microsoft.github.io/flipcard/schema/v0.1.json'

flipCardManifestSchema;
// → JSON Schema (draft-07) describing FlipCardManifest

validateManifest({ id: 'x', title: 'Hello' });
// → { valid: true, errors: [] }
```

`validateManifest` only checks non-null object input, string fields
`$schema`/`version`/`id`/`title`, and non-null object values for `workflow` and
`metadata`. It does not reject arrays, unknown properties, invalid URI formats,
or malformed nested actions, and does not validate `design`/`schema` or renderer
assets. For full draft-07 validation use [Ajv](https://ajv.js.org/) against
`flipCardManifestSchema`, with URI format support configured. Renderer and
Adaptive Card compatibility require separate checks.

## Stock quote helpers

`parseStockQuote(value, now?)` validates the narrow MSFT/USD quote contract,
returning a quote, `null` for no data, or throwing for invalid data.
It is separate from manifest validation.

`createStockQuoteClient({ endpoint, onState, ... })` returns `start()`, `stop()`,
`refresh()`, and `offline()`. Start before refreshing; stop to abort an in-flight
request and clear polling. The client does not install browser event listeners.
The showcase hook supplies visibility/offline handling and unmount cleanup.

Defaults are `STOCK_QUOTE_INTERVAL_MS` (**5 minutes**), a **10-second** timeout,
and `STOCK_QUOTE_STALE_MS` (**36 hours**). Options allow injected `fetch` and `now`,
plus `intervalMs`, `timeoutMs`, and `staleAfterMs`.
`StockQuoteStatus` is `not-configured`, `loading`, `ready`, `stale`, `error`,
`no-data`, or `offline`.

`hydrateStockQuoteCard(template, state, now?)` returns a copy with the stock
template's named Adaptive Card `TextBlock` fields and `speak` updated. It does
not mutate the template or insert HTML. Its displayed stale annotation uses
the fixed 36-hour threshold.

There is no bundled provider, API key, or fabricated price fallback. See
[stock quote setup](../getting-started.md#stock-quote-card) for the public endpoint
contract, CORS, licensing, and credential restrictions.

## See also

- **[Manifest reference](../reference/manifest)** — the full JSON Schema.
- **[`@microsoft/flipcard-react`](./react)** — React renderer that consumes this controller.
- **[`@microsoft/flipcard`](./vanilla.md)** — vanilla DOM renderer built on the same core.
