$pluginRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$distDirectory = Join-Path $pluginRoot 'dist'
$packagePath = Join-Path $distDirectory 'PLM-Photoshop-Copywriting-0.1.14.ccx'
$zipPath = Join-Path $distDirectory 'PLM-Photoshop-Copywriting-0.1.14.zip'
$packageFiles = @(
  'manifest.json',
  'index.html',
  'main.js',
  'copywriting.js',
  'selection-layout.js',
  'file-match.js',
  'styles.css'
)

New-Item -ItemType Directory -Path $distDirectory -Force | Out-Null
if (Test-Path -LiteralPath $packagePath) {
  Remove-Item -LiteralPath $packagePath -Force
}
if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Push-Location $pluginRoot
try {
  Compress-Archive -LiteralPath $packageFiles -DestinationPath $zipPath -CompressionLevel Optimal
  Move-Item -LiteralPath $zipPath -Destination $packagePath -Force
} finally {
  Pop-Location
}

Write-Output $packagePath
