param(
  [ValidateSet('start', 'debug', 'debug:network', 'debug:cli', 'preview', 'build', 'build:debug', 'test', 'lint', 'verify', 'versions')]
  [string]$Script = 'debug'
)

$ErrorActionPreference = 'Stop'
$repositoryPath = Split-Path -Parent $PSScriptRoot
$versionFile = Join-Path $repositoryPath '.nvmrc'
$nodeVersion = (Get-Content -LiteralPath $versionFile -Raw).Trim()
$nvmCommand = Get-Command nvm.exe -ErrorAction Stop
$nvmRoot = Split-Path -Parent $nvmCommand.Source
$nodeDirectory = Join-Path $nvmRoot "v$nodeVersion"
$nodeExecutable = Join-Path $nodeDirectory 'node.exe'
$npmExecutable = Join-Path $nodeDirectory 'npm.cmd'

if (-not (Test-Path -LiteralPath $nodeExecutable) -or -not (Test-Path -LiteralPath $npmExecutable)) {
  throw "Node $nodeVersion is not installed under $nvmRoot. Run: nvm install $nodeVersion 64"
}

$env:Path = "$nodeDirectory;$env:Path"
Set-Location -LiteralPath $repositoryPath

Write-Host "Using Node $(& $nodeExecutable --version) from $nodeDirectory"
Write-Host "Running npm script: $Script"
& $npmExecutable run $Script
exit $LASTEXITCODE
