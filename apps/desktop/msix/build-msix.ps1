#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Builds an MSIX package for FlipCard Studio.

.DESCRIPTION
    Tauri 2 ships MSI and NSIS bundles natively; MSIX is produced as a
    post-build step using MakeAppx.exe from the Windows 10/11 SDK.

    This script:
      1. Runs `tauri build` to produce the release binary + MSI bundle.
      2. Stages the binary, WebView2 loader, and resources into msix-staging/.
      3. Drops AppxManifest.xml + Assets/ into staging.
      4. Calls MakeAppx.exe pack to produce out/FlipCardStudio.msix.
      5. Optionally signs the package with SignTool.exe when MSIX_CERT_PATH
         (and MSIX_CERT_PASSWORD) env vars are set.

.PARAMETER SkipBuild
    Skip the `tauri build` step and reuse the existing release artifacts.

.PARAMETER Configuration
    Cargo profile. Defaults to "release".

.EXAMPLE
    pwsh apps/desktop/msix/build-msix.ps1

.EXAMPLE
    $env:MSIX_CERT_PATH = "C:\certs\flipcard.pfx"
    $env:MSIX_CERT_PASSWORD = "..."
    pwsh apps/desktop/msix/build-msix.ps1
#>
[CmdletBinding()]
param(
    [switch]$SkipBuild,
    [string]$Configuration = 'release'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$here       = Split-Path -Parent $MyInvocation.MyCommand.Path
$desktopDir = Resolve-Path (Join-Path $here '..')
$staging    = Join-Path $desktopDir 'msix-staging'
$outDir     = Join-Path $desktopDir 'out'
$bundleDir  = Join-Path $desktopDir "src-tauri\target\$Configuration"
$manifest   = Join-Path $here 'AppxManifest.xml'
$assetsSrc  = Join-Path $here 'Assets'

Write-Host "==> FlipCard Studio MSIX builder" -ForegroundColor Cyan
Write-Host "    desktopDir: $desktopDir"
Write-Host "    staging:    $staging"
Write-Host "    outDir:     $outDir"

if (-not $SkipBuild) {
    Write-Host "==> Running tauri build" -ForegroundColor Cyan
    Push-Location $desktopDir
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) { throw "tauri build failed (exit $LASTEXITCODE)" }
    } finally {
        Pop-Location
    }
}

# Locate MakeAppx.exe in the latest Windows 10/11 SDK.
$sdkRoot = Join-Path ${env:ProgramFiles(x86)} 'Windows Kits\10\bin'
if (-not (Test-Path $sdkRoot)) {
    throw "Windows 10/11 SDK not found at $sdkRoot. Install via Visual Studio Installer or standalone SDK."
}
$makeAppx = Get-ChildItem $sdkRoot -Recurse -Filter 'MakeAppx.exe' -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match '\\x64\\' } |
    Sort-Object FullName -Descending |
    Select-Object -First 1
if (-not $makeAppx) {
    throw "MakeAppx.exe (x64) not found under $sdkRoot."
}
Write-Host "    MakeAppx:   $($makeAppx.FullName)"

# Reset staging.
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Force -Path $staging | Out-Null
New-Item -ItemType Directory -Force -Path $outDir  | Out-Null

# Copy main binary.
$exe = Join-Path $bundleDir 'flipcard-desktop.exe'
if (-not (Test-Path $exe)) {
    throw "Built binary not found: $exe. Run without -SkipBuild first."
}
Copy-Item $exe -Destination $staging

# Copy AppxManifest.xml.
Copy-Item $manifest -Destination (Join-Path $staging 'AppxManifest.xml')

# Copy MSIX visual assets if present, otherwise reuse Tauri icons as a fallback.
$assetsDest = Join-Path $staging 'Assets'
New-Item -ItemType Directory -Force -Path $assetsDest | Out-Null
if (Test-Path $assetsSrc) {
    Copy-Item (Join-Path $assetsSrc '*') -Destination $assetsDest -Recurse -Force
} else {
    Write-Warning "msix/Assets not found — reusing src-tauri/icons placeholders."
    $iconsDir = Join-Path $desktopDir 'src-tauri\icons'
    Copy-Item (Join-Path $iconsDir '128x128.png')       -Destination (Join-Path $assetsDest 'Square150x150Logo.png')
    Copy-Item (Join-Path $iconsDir '32x32.png')         -Destination (Join-Path $assetsDest 'Square44x44Logo.png')
    Copy-Item (Join-Path $iconsDir '128x128.png')       -Destination (Join-Path $assetsDest 'Square71x71Logo.png')
    Copy-Item (Join-Path $iconsDir '128x128@2x.png')    -Destination (Join-Path $assetsDest 'Wide310x150Logo.png')
    Copy-Item (Join-Path $iconsDir '32x32.png')         -Destination (Join-Path $assetsDest 'StoreLogo.png')
}

# Pack.
$msixOut = Join-Path $outDir 'FlipCardStudio.msix'
if (Test-Path $msixOut) { Remove-Item $msixOut -Force }
Write-Host "==> Packing MSIX -> $msixOut" -ForegroundColor Cyan
& $makeAppx.FullName pack /d $staging /p $msixOut /o
if ($LASTEXITCODE -ne 0) { throw "MakeAppx.exe failed (exit $LASTEXITCODE)" }

# Optional signing.
if ($env:MSIX_CERT_PATH) {
    Write-Host "==> Signing MSIX with $env:MSIX_CERT_PATH" -ForegroundColor Cyan
    $signTool = Get-ChildItem $sdkRoot -Recurse -Filter 'signtool.exe' -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -match '\\x64\\' } |
        Sort-Object FullName -Descending |
        Select-Object -First 1
    if (-not $signTool) { throw "signtool.exe not found under $sdkRoot." }

    $signArgs = @('sign', '/fd', 'SHA256', '/a', '/f', $env:MSIX_CERT_PATH)
    if ($env:MSIX_CERT_PASSWORD) { $signArgs += @('/p', $env:MSIX_CERT_PASSWORD) }
    $signArgs += $msixOut
    & $signTool.FullName @signArgs
    if ($LASTEXITCODE -ne 0) { throw "signtool.exe failed (exit $LASTEXITCODE)" }
} else {
    Write-Host "    (Set MSIX_CERT_PATH to enable signing.)" -ForegroundColor DarkGray
}

Write-Host "==> Done: $msixOut" -ForegroundColor Green
