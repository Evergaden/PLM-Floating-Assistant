param(
  [string]$AppDataRoot = $env:APPDATA
)

$ErrorActionPreference = 'Stop'

$pluginRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$pluginId = 'com.violet.plm.photoshop-copywriting'
$pluginVersion = '0.1.19'
$installFolderName = 'PLM-Photoshop-Copywriting-0.1.19'
$manifestPath = Join-Path $pluginRoot 'manifest.json'
$externalRoot = Join-Path $AppDataRoot 'Adobe\UXP\Plugins\External'
$installRoot = Join-Path $externalRoot $installFolderName
$pluginsInfoRoot = Join-Path $AppDataRoot 'Adobe\UXP\PluginsInfo\v1'
$pluginsInfoPath = Join-Path $pluginsInfoRoot 'PS.json'
$legacyInstallRoots = @(
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.0'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.1'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.2'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.3'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.4'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.5'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.6'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.7'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.8'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.9'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.10'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.11'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.12'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.13'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.14')
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.15')
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.16'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.17'),
  (Join-Path $externalRoot 'PLM-Photoshop-Copywriting-0.1.18')
)
$runtimeFiles = @(
  'manifest.json',
  'index.html',
  'main.js',
  'copywriting.js',
  'selection-layout.js',
  'artwork-mode.js',
  'file-match.js',
  'styles.css',
  'icons/plugin-dark.png',
  'icons/plugin-dark@2x.png',
  'icons/plugin-light.png',
  'icons/plugin-light@2x.png'
)

if (-not (Test-Path -LiteralPath $manifestPath)) {
  throw "Missing plugin manifest.json: $manifestPath"
}

$manifest = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
if ([string]$manifest.id -ne $pluginId) {
  throw 'The manifest plugin ID does not match this installer.'
}

New-Item -ItemType Directory -Path $externalRoot -Force | Out-Null
New-Item -ItemType Directory -Path $installRoot -Force | Out-Null
foreach ($file in $runtimeFiles) {
  $source = Join-Path $pluginRoot $file
  if (-not (Test-Path -LiteralPath $source)) {
    throw "Missing plugin file: $source"
  }
  $destination = Join-Path $installRoot $file
  $destinationParent = Split-Path -Parent $destination
  New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}
foreach ($legacyInstallRoot in $legacyInstallRoots) {
  if (Test-Path -LiteralPath $legacyInstallRoot) {
    Remove-Item -LiteralPath $legacyInstallRoot -Recurse -Force
  }
}

New-Item -ItemType Directory -Path $pluginsInfoRoot -Force | Out-Null
$payload = [pscustomobject]@{ plugins = @() }
if (Test-Path -LiteralPath $pluginsInfoPath) {
  $backupPath = $pluginsInfoPath + '.bak-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
  Copy-Item -LiteralPath $pluginsInfoPath -Destination $backupPath -Force
  $existingText = Get-Content -LiteralPath $pluginsInfoPath -Raw -Encoding UTF8
  if ($existingText.Trim()) {
    $payload = $existingText | ConvertFrom-Json
  }
  if (-not ($payload.PSObject.Properties.Name -contains 'plugins')) {
    $payload | Add-Member -NotePropertyName plugins -NotePropertyValue @()
  }
}

$entry = [pscustomobject][ordered]@{
  hostMinVersion = [string]$manifest.host.minVersion
  name = [string]$manifest.name
  path = ('$localPlugins\External\' + $installFolderName)
  pluginId = $pluginId
  status = 'enabled'
  type = 'uxp'
  versionString = $pluginVersion
}

$plugins = @($payload.plugins) | Where-Object { [string]$_.pluginId -ne $pluginId }
$payload.plugins = @($plugins + $entry)
$json = $payload | ConvertTo-Json -Depth 10
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($pluginsInfoPath, $json, $utf8NoBom)

Write-Output "Plugin files copied to: $installRoot"
Write-Output "Plugin registration written to: $pluginsInfoPath"
Write-Output 'Fully quit and restart Photoshop.'
