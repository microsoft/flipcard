---
sidebar_position: 99
title: Contributing
---

# Contributing

We welcome issues and pull requests. The full process is documented in [`CONTRIBUTING.md`](https://github.com/microsoft/flipcard/blob/main/CONTRIBUTING.md). The short version:

## Local setup

```bash
git clone https://github.com/microsoft/flipcard.git
cd flipcard
npm install
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

All three must pass. Add tests for new behavior — every package uses [Vitest](https://vitest.dev/).

## Working on the docs site

```bash
cd docs
npm install
npm start            # dev server at http://localhost:3000
npm run build        # static build into docs/build
```

## Reporting security issues

Please **do not** open a public GitHub issue. Follow [`SECURITY.md`](https://github.com/microsoft/flipcard/blob/main/SECURITY.md) to report vulnerabilities through the Microsoft Security Response Center.

## Code of conduct

This project follows the [Microsoft Open Source Code of Conduct](https://github.com/microsoft/flipcard/blob/main/CODE_OF_CONDUCT.md).
