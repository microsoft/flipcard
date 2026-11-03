---
sidebar_position: 99
title: Contributing
---

# Contributing

We welcome issues and pull requests. The full process is documented in [`CONTRIBUTING.md`](https://github.com/microsoft/flipcard/blob/main/CONTRIBUTING.md). The short version:

## Local setup

Use Node.js **22.18+ in 22.x, 24.11+ in 24.x, or 26+** and npm 10+.
Build from source; these examples do not depend on published FlipCard packages.

```bash
git clone https://github.com/microsoft/flipcard.git
cd flipcard
npm ci
npm run build
npm test
```

## Quality gates

Before opening a pull request, run:

```bash
npm run lint
npm run typecheck
npm test
```

Add tests for new behavior using the existing [Vitest](https://vitest.dev/)
setup, and run `npm run build` before submitting. These are required checks,
not a claim that the current branch is passing or has no security alerts.

TypeScript 7 builds the workspaces; TypeScript 6 is isolated in lint tooling for
parser compatibility. The dev container uses Node 24 and image version 5.2.5.

## Working on the docs site

```bash
cd docs
npm ci
npm start            # dev server at http://localhost:3000
npm run build        # static build into docs/build
```

The docs install uses its own lockfile. `.github/workflows/deploy.yml` combines
Docusaurus, FlipDeck (`/flipdeck/` and compatibility `/showcase/`), and the exported
manifest schema (`/schema/v0.1.json`) under `/flipcard/`.
Set repository **Settings → Pages → Source** to **GitHub Actions**.
Branch/Jekyll publishing does not build the site. Deployment and hosted links
must be verified separately from a local build.

## Reporting security issues

Please **do not** open a public GitHub issue. Follow [`SECURITY.md`](https://github.com/microsoft/flipcard/blob/main/SECURITY.md) to report vulnerabilities through the Microsoft Security Response Center.

## Code of conduct

This project follows the [Microsoft Open Source Code of Conduct](https://github.com/microsoft/flipcard/blob/main/CODE_OF_CONDUCT.md).
