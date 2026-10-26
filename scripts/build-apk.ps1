param([string]$VersionCode, [string]$VersionName = '1.1.2', [switch]$SkipInstall, [switch]$ForceInstall)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectRoot
function Invoke-Checked([string]$Command, [string[]]$Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) { throw "$Command failed with exit code $LASTEXITCODE" }
}
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 22+ is required.' }
    if (-not $env:JAVA_HOME) {
        $javaCommand = Get-Command java -ErrorAction SilentlyContinue
        if ($javaCommand) { $env:JAVA_HOME = Split-Path -Parent (Split-Path -Parent $javaCommand.Source) }
    }
    if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
    if (-not (Test-Path -LiteralPath $env:ANDROID_HOME)) { throw 'Set ANDROID_HOME to your Android SDK directory.' }
    if (-not $env:ANDROID_KEYSTORE_PATH -and -not (Test-Path 'android/keystore.properties')) {
        throw 'Missing signing configuration. Create android/keystore.properties using android/keystore.properties.example.'
    }
    $releasesDir = Join-Path $projectRoot 'releases'
    if (Test-Path -LiteralPath $releasesDir) {
        Get-ChildItem -LiteralPath $releasesDir -Force | Remove-Item -Recurse -Force
    } else {
        New-Item -ItemType Directory -Path $releasesDir -Force | Out-Null
    }
    if (-not $VersionCode) { $VersionCode = '1' }
    $parsedCode = 0L
    if (-not [long]::TryParse($VersionCode, [ref]$parsedCode) -or $parsedCode -le 0 -or $parsedCode -gt 2100000000) {
        throw 'VersionCode must be a positive integer <= 2100000000.'
    }
    $env:ANDROID_VERSION_CODE = $VersionCode
    $env:ANDROID_VERSION_NAME = $VersionName
    if (-not $SkipInstall) {
        if (Test-Path 'node_modules') {
            if ($ForceInstall) {
                Invoke-Checked 'npm.cmd' @('ci', '--no-audit', '--no-fund')
            } else {
                Write-Host 'node_modules found; skipping npm ci (pass -ForceInstall to reinstall).'
            }
        } else {
            Invoke-Checked 'npm.cmd' @('ci', '--no-audit', '--no-fund')
        }
    }
    Invoke-Checked 'npm.cmd' @('run', 'typecheck')
    Invoke-Checked 'npm.cmd' @('run', 'test')
    Invoke-Checked 'npm.cmd' @('run', 'build:devlocal')
    Invoke-Checked 'npx.cmd' @('cap', 'sync', 'android')
    Push-Location android
    if (-not (Test-Path 'local.properties')) {
        $escapedSdk = $env:ANDROID_HOME -replace '\\', '\\'
        "sdk.dir=$escapedSdk" | Set-Content -LiteralPath 'local.properties' -Encoding ascii
    }
    try {
        Invoke-Checked '.\gradlew.bat' @('assembleRelease')
    } finally {
        Pop-Location
    }
    $apkPath = Join-Path $releasesDir "Runic-$VersionName-release.apk"
    Copy-Item -LiteralPath 'android/app/build/outputs/apk/release/app-release.apk' -Destination $apkPath
    $buildTools = Get-ChildItem -LiteralPath (Join-Path $env:ANDROID_HOME 'build-tools') -Directory |
        Where-Object { Test-Path (Join-Path $_.FullName 'apksigner.bat') } | Sort-Object Name -Descending | Select-Object -First 1
    if (-not $buildTools) { throw 'Android build-tools/apksigner is required to verify the release.' }
    Invoke-Checked (Join-Path $buildTools.FullName 'apksigner.bat') @('verify', '--verbose', '--print-certs', $apkPath)
    $algorithm = [Security.Cryptography.SHA256]::Create()
    $stream = [IO.File]::OpenRead($apkPath)
    try { $hash = [BitConverter]::ToString($algorithm.ComputeHash($stream)).Replace('-', '').ToLowerInvariant() }
    finally { $stream.Dispose(); $algorithm.Dispose() }
    "$hash  $([IO.Path]::GetFileName($apkPath))" | Set-Content -LiteralPath "$apkPath.sha256" -Encoding ascii
    Write-Host "Release APK: $apkPath"
    exit 0
} catch { Write-Error $_ -ErrorAction Continue; exit 1 }
