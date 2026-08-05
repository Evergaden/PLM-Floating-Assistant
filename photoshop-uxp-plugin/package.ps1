$pluginRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distDirectory = Join-Path $pluginRoot 'dist'
$packagePath = Join-Path $distDirectory 'PLM-Photoshop-Copywriting-0.1.23.ccx'
$zipPath = Join-Path $distDirectory 'PLM-Photoshop-Copywriting-0.1.23.zip'
$stagingDirectory = Join-Path $distDirectory '.package-staging-0.1.23'
$packageFiles = @(
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

New-Item -ItemType Directory -Path $distDirectory -Force | Out-Null
if (Test-Path -LiteralPath $packagePath) {
  Remove-Item -LiteralPath $packagePath -Force
}
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}
if (Test-Path -LiteralPath $stagingDirectory) {
  Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
}

try {
  New-Item -ItemType Directory -Path $stagingDirectory -Force | Out-Null
  foreach ($file in $packageFiles) {
    $source = Join-Path $pluginRoot $file
    $destination = Join-Path $stagingDirectory $file
    $destinationParent = Split-Path -Parent $destination
    New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Force
  }
  Compress-Archive -Path (Join-Path $stagingDirectory '*') -DestinationPath $zipPath -CompressionLevel Optimal
  Move-Item -LiteralPath $zipPath -Destination $packagePath -Force
} finally {
  if (Test-Path -LiteralPath $stagingDirectory) {
    Remove-Item -LiteralPath $stagingDirectory -Recurse -Force
  }
}

Write-Output $packagePath
