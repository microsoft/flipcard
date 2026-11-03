# FlipCard documentation

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Local setup

Use Node.js **22.18+ in 22.x, 24.11+ in 24.x, or 26+** and npm 10+.
The documentation has a separate lockfile; run these commands from `docs`:

```bash
npm ci
```

## Local Development

```bash
npm start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
npm run serve
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Deployment

The repository deploys through `.github/workflows/deploy.yml`, not `yarn deploy`
or a branch-based Jekyll build. Set **Settings → Pages → Build and deployment →
Source** to **GitHub Actions**.

On pushes to `main` or manual dispatch, the workflow:

1. Installs root dependencies and builds the local libraries.
2. Installs docs dependencies and builds Docusaurus with `GITHUB_PAGES=true`.
3. Builds FlipDeck and composes one Pages artifact.
4. Uploads and deploys that artifact with GitHub's Pages actions.

Paths under `https://microsoft.github.io/flipcard/`:

| Path | Content |
|---|---|
| `/` | Docusaurus documentation |
| `/flipdeck/` | FlipDeck gallery |
| `/showcase/` | Compatibility copy of the gallery |
| `/schema/v0.1.json` | Schema exported from the built core package |

For a local Pages-base-path build in PowerShell:

```powershell
$env:GITHUB_PAGES = 'true'
npm run build
npm run serve
```

The local docs build does not compose the gallery/schema artifact. A successful
build does not confirm the remote Pages source setting or a successful hosted
deployment. Verify the workflow run and hosted URLs separately; a Jekyll log
indicates the wrong publishing source for this project.
