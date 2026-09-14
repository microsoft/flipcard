# Contributing to flipcard

Thanks for contributing to **flipcard**.

## Prerequisites

- Node.js 20+
- npm 10+
- Git

## Workspace setup

```bash
npm install
npm run build:libs
```

Useful commands:

```bash
npm run dev          # FlipDeck (Vite dev server for apps/showcase)
npm run lint
npm run typecheck
npm run test
npm run build
```

## Adding a FlipDeck asset

The FlipDeck gallery dogfoods the `flipCardAssetLibrary` exported from
`@microsoft/flipcard`. To add a new card to the deck:

- Add the asset entry to `packages/vanilla/src/assets.ts` (typed as `FlipCardAssetEntry`).
- Pick an existing `FlipCardAssetCategory` or extend the enum in `packages/vanilla/src/types.ts`
  and update `flipCardCategoryLabels` in the same file.
- Run `npm run dev` and verify the card renders, flips, and themes correctly.

Prefer assets that demonstrate:

- the default path
- controlled and uncontrolled behavior
- schema / manifest usage
- accessibility or theming variants

## Adding a package

1. Create the package under `packages/<name>`.
2. Add a `package.json`, `tsconfig.json`, source entrypoint, and README.
3. Export clean public APIs.
4. Add tests, and a FlipDeck asset when the package is UI-facing.
5. Wire the package into root scripts or workspace references if needed.

## Testing

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Pull requests

- Keep changes focused and documented.
- Add or update FlipDeck assets for UI behavior changes.
- Conventional Commits are encouraged.

## Code of Conduct

This project follows the [Microsoft Open Source Code of Conduct](./CODE_OF_CONDUCT.md).
