[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8000,
    [string]$BindAddress = '127.0.0.1',
    [switch]$NoReload
)

$ErrorActionPreference = 'Stop'
$backendDirectory = Join-Path $PSScriptRoot 'backend'
$pythonExecutable = Join-Path $backendDirectory '.venv\Scripts\python.exe'

if (-not (Test-Path -LiteralPath $pythonExecutable -PathType Leaf)) {
    throw 'Backend virtual environment missing. From the project root, run: python -m venv backend\.venv; backend\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt'
}

$uvicornArguments = @(
    '-m', 'uvicorn', 'app.main:app',
    '--app-dir', $backendDirectory,
    '--host', $BindAddress,
    '--port', $Port.ToString()
)
if (-not $NoReload) {
    $uvicornArguments += @('--reload', '--reload-dir', $backendDirectory)
}

# Relative database URLs resolve against the backend, just as they do with cd backend.
Push-Location -LiteralPath $backendDirectory
try {
    & $pythonExecutable @uvicornArguments
    $serverExitCode = $LASTEXITCODE
}
finally {
    Pop-Location
}
exit $serverExitCode
