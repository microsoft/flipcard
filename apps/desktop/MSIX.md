# MSIX packaging for FlipCard Studio

Tauri 2 produces **MSI** and **NSIS** installers natively. **MSIX** is built as a
post-build step using `MakeAppx.exe` from the Windows 10/11 SDK.

## Prerequisites

- Windows 10 (1903+) or Windows 11
- [Windows 10/11 SDK](https://developer.microsoft.com/windows/downloads/windows-sdk/) — installs `MakeAppx.exe` and `SignTool.exe` under `C:\Program Files (x86)\Windows Kits\10\bin\<version>\x64\`
- Rust toolchain (`rustup`) and Visual Studio 2022 Build Tools with the **Desktop development with C++** workload
- WebView2 Runtime (Tauri config bootstraps it on first run)
- A code-signing certificate (`.pfx`) — required for sideload install on machines without `AllowAllTrustedApps`, and required for Microsoft Store submission

## Build locally

From the repo root:

```pwsh
pwsh apps/desktop/msix/build-msix.ps1
```

This:

1. Runs `tauri build` (`npm run build` inside `apps/desktop/`) to produce the release binary and MSI/NSIS bundles under `apps/desktop/src-tauri/target/release/bundle/`.
2. Stages the binary + `AppxManifest.xml` + visual assets into `apps/desktop/msix-staging/`.
3. Calls `MakeAppx.exe pack` to produce `apps/desktop/out/FlipCardStudio.msix`.
4. If `MSIX_CERT_PATH` is set, signs with `SignTool.exe` (uses `MSIX_CERT_PASSWORD` if provided).

Skip the rebuild and re-pack from existing artifacts:

```pwsh
pwsh apps/desktop/msix/build-msix.ps1 -SkipBuild
```

## Visual assets

`AppxManifest.xml` references logos in `Assets/`:

- `Square150x150Logo.png` (150×150)
- `Square44x44Logo.png` (44×44)
- `Square71x71Logo.png` (71×71)
- `Wide310x150Logo.png` (310×150)
- `StoreLogo.png` (50×50)

If `apps/desktop/msix/Assets/` does not exist, the build script reuses the
placeholder PNGs from `src-tauri/icons/`. Replace these with real branded
artwork before submission.

## Install for testing

PowerShell (admin not required for trusted packages):

```pwsh
Add-AppxPackage -Path apps/desktop/out/FlipCardStudio.msix
```

To install an unsigned package on a dev box, enable developer mode under
Settings → System → For developers, or import the signing cert into
`Cert:\LocalMachine\TrustedPeople`.

## Microsoft Store submission

1. Reserve the `Microsoft.FlipCardStudio` (or final) name in Partner Center.
2. Update `<Identity Name=... Publisher=...>` in `AppxManifest.xml` to match the
   values shown in Partner Center for your reserved app.
3. Bump `<Identity Version="x.y.z.0">` for every submission (the trailing
   revision must stay `0`).
4. Build the package, upload to Partner Center, and let Store-side signing
   replace your dev cert.

## Code signing in CI

`.github/workflows/desktop-release.yml` does **not** sign by default. Wire up
signing by exposing a base64-encoded `.pfx` as the `WINDOWS_CERTIFICATE` repo
secret and decoding it in a CI step (see the comment block in that workflow).

## Troubleshooting

- **`MakeAppx.exe` not found** → install the Windows 10/11 SDK component via
  Visual Studio Installer.
- **`error 0x80080204` on install** → identity in `AppxManifest.xml` does not
  match the signing certificate's subject. Either re-sign with a matching
  cert or update the `Publisher=` attribute.
- **WebView2 missing on target** → `bundle.windows.webviewInstallMode` is
  `embedBootstrapper`, so the Tauri-built MSI/NSIS handles this. For MSIX,
  consider documenting WebView2 as a Store dependency.
