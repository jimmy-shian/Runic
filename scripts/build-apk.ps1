param([string]$VersionCode, [string]$VersionName = '1.1.0', [switch]$SkipInstall)
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
    $statePath = Join-Path $projectRoot '.release-state.json'
    $previous = 0L
    if (Test-Path -LiteralPath $statePath) { $previous = [long](Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json).versionCode }
    if (-not $VersionCode) {
        $VersionCode = (& node scripts/release-version.mjs)
        if ($LASTEXITCODE -ne 0) { throw 'Failed to allocate a versionCode.' }
    }
    $parsedCode = 0L
    if (-not [long]::TryParse($VersionCode, [ref]$parsedCode) -or $parsedCode -le $previous -or $parsedCode -gt 2100000000) {
        throw 'VersionCode must exceed the previous local release and be <= 2100000000.'
    }
    $env:ANDROID_VERSION_CODE = $VersionCode
    $env:ANDROID_VERSION_NAME = $VersionName
    if (-not $SkipInstall) { Invoke-Checked 'npm.cmd' @('ci', '--no-audit', '--no-fund') }
    Invoke-Checked 'npm.cmd' @('run', 'typecheck')
    Invoke-Checked 'npm.cmd' @('run', 'test')
    Invoke-Checked 'npm.cmd' @('run', 'build:devlocal')
    Invoke-Checked 'npx.cmd' @('cap', 'sync', 'android')
    Push-Location android
    try { Invoke-Checked '.\gradlew.bat' @('--no-daemon', 'assembleRelease') } finally { Pop-Location }
    New-Item -ItemType Directory -Path releases -Force | Out-Null
    $apkPath = Join-Path $projectRoot "releases\Runic-$VersionName-$VersionCode-release.apk"
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
    @{ versionCode = $parsedCode; versionName = $VersionName } | ConvertTo-Json | Set-Content -LiteralPath $statePath
    Write-Host "Release APK: $apkPath"
    exit 0
} catch { Write-Error $_ -ErrorAction Continue; exit 1 }
