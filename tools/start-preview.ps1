$ErrorActionPreference = 'Stop'
$portfolioRoot = Split-Path -Parent $PSScriptRoot
$publicRoot = Join-Path $portfolioRoot 'publish'
$bundledPython = Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
if (Test-Path -LiteralPath $bundledPython) {
    $pythonForPreview = $bundledPython
} else {
    $pythonForPreview = (Get-Command python -ErrorAction Stop).Source
}
Write-Host 'Preview: http://127.0.0.1:8767/ — public files only. Stop with Ctrl+C.'
& $pythonForPreview -u -m http.server 8767 --bind 127.0.0.1 --directory $publicRoot
