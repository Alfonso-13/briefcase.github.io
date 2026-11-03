param(
  [switch]$Production,
  [switch]$Verify,
  [switch]$Network
)

$ErrorActionPreference = 'Stop'

if (@($Production, $Verify, $Network).Where({ $_ }).Count -gt 1) {
  throw 'Use only one mode: -Production, -Verify, or -Network.'
}

$repositoryPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$versionFile = Join-Path $repositoryPath '.nvmrc'
$nodeVersion = (Get-Content -LiteralPath $versionFile -Raw).Trim()
$nvmCommand = Get-Command nvm.exe -ErrorAction Stop
$nvmRoot = Split-Path -Parent $nvmCommand.Source
$nodeDirectory = Join-Path $nvmRoot "v$nodeVersion"
$nodeExecutable = Join-Path $nodeDirectory 'node.exe'
$npmExecutable = Join-Path $nodeDirectory 'npm.cmd'

Write-Host 'Installed NVM versions:'
& $nvmCommand.Source list

if (-not (Test-Path -LiteralPath $nodeExecutable) -or -not (Test-Path -LiteralPath $npmExecutable)) {
  throw "Node $nodeVersion is not installed. Run: nvm install $nodeVersion 64"
}

$env:Path = "$nodeDirectory;$env:Path"
$env:NODE_OPTIONS = '--use-system-ca'
Set-Location -LiteralPath $repositoryPath

Write-Host "Using Node $(& $nodeExecutable --version) and npm $(& $npmExecutable --version)"

if (-not (Test-Path -LiteralPath (Join-Path $repositoryPath 'node_modules'))) {
  Write-Host 'Installing dependencies from package-lock.json...'
  & $npmExecutable ci --no-audit --no-fund
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

if ($Verify) {
  & $npmExecutable run verify
} elseif ($Production) {
  & $npmExecutable run preview
} elseif ($Network) {
  & $npmExecutable run 'debug:network'
} else {
  & $npmExecutable run debug
}

exit $LASTEXITCODE
