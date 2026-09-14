---
sidebar_position: 1
title: '@microsoft/flipcard-core'
---

# `@microsoft/flipcard-core`

Framework‑agnostic foundation for FlipCard. Contains the manifest types, the state‑machine controller, the JSON Schema, and a lightweight runtime validator. **No DOM. No framework. No deps.**

## Install

```bash
npm install @microsoft/flipcard-core
```

## Exports

```ts
export type { FlipState, FlipCardManifest, FlipCardWorkflow, FlipCardOptions } from '@microsoft/flipcard-core';
export { FlipCardController, FLIPCARD_SCHEMA_URL, flipCardManifestSchema, validateManifest } from '@microsoft/flipcard-core';
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

A tiny state machine consumed by every renderer.

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

`validateManifest` is intentionally narrow — for full draft‑07 validation use [Ajv](https://ajv.js.org/) against `flipCardManifestSchema`.

## See also

- **[Manifest reference](../reference/manifest)** — the full JSON Schema.
- **[`@microsoft/flipcard-react`](./react)** — React renderer that consumes this controller.
- **[`@microsoft/flipcard`](./vanilla)** — vanilla web component built on the same core.
