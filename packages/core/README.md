# @microsoft/flipcard-core

Framework-agnostic core for [FlipCard](https://github.com/microsoft/flipcard) — the first primitive in an adaptive, manifest schema-driven, composable UI system.

This package contains:

- **Types** — `FlipState`, `FlipCardManifest`, `FlipCardWorkflow`, `FlipCardOptions`.
- **Controller** — a tiny state machine (`FlipCardController`) consumed by the React, vanilla, and web component bindings.
- **Schema** — the JSON Schema (draft-07) for the FlipCard manifest, plus a lightweight runtime validator.

## Install

```sh
npm install @microsoft/flipcard-core
```

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

## Vision

FlipCard decouples **design ⟂ schema ⟂ workflow**. The front face is the rendered design, the back face is the manifest schema, and a click flips between them. This package provides the schema and state primitives that all renderers share.

## License

MIT
