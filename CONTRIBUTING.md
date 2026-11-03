# Contributing to flipcard

Thanks for contributing to **flipcard**.

## Prerequisites

- Node.js 22.18+ in 22.x, 24.11+ in 24.x, or 26+
- npm 10+
- Git

## Workspace setup

```bash
npm ci
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

Build the local workspaces before using package imports; an npm publication is
not assumed. TypeScript 7 compiles application code and declarations. The lint
tooling workspace isolates TypeScript 6 for parser compatibility.
The dev container uses
`mcr.microsoft.com/devcontainers/typescript-node:5.2.5-24-bookworm` (Node 24).

## Adding a FlipDeck asset

The FlipDeck gallery dogfoods the `flipCardAssetLibrary` exported from
`@microsoft/flipcard`. To add a new card to the deck:

- Add the asset entry to `packages/vanilla/src/assets.ts` (typed as `FlipCardAssetEntry`).
- Pick an existing `FlipCardAssetCategory`, or extend its union in
  `packages/vanilla/src/types.ts` and the matching React type. Update
  `flipCardCategoryLabels` in `packages/vanilla/src/assets.ts`.
- Run `npm run dev` and verify the card renders, flips, and themes correctly.

Prefer assets that demonstrate:

- the default path
- initial face, disabled interaction, and React `onFlip` behavior
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

These are checks to run, not a statement that the current branch has passed
every check or has no security alerts.

## Documentation and Pages

The docs have a separate lockfile:

```bash
cd docs
npm ci
npm start
npm run build
```

`.github/workflows/deploy.yml` builds Docusaurus and FlipDeck, exports the core
manifest schema, and deploys a Pages artifact. Repository **Settings → Pages →
Source** must be **GitHub Actions**, not branch/Jekyll publishing. See
[docs/README.md](./docs/README.md) for the deployment paths and local preview.

## Pull requests

- Keep changes focused and documented.
- Add or update FlipDeck assets for UI behavior changes.
- Conventional Commits are encouraged.

## Code of Conduct

This project follows the [Microsoft Open Source Code of Conduct](./CODE_OF_CONDUCT.md).
