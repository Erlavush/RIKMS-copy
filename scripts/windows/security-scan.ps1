[CmdletBinding()]
param(
    [string]$Target = "http://127.0.0.1:8000",
    [ValidateSet("local", "staging", "production")]
    [string]$Environment = "local",
    [ValidateSet("passive", "active")]
    [string]$Mode = "passive",
    [string]$Output = "storage\app\security\reports\native-windows.json",
    [string]$Revision = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot

try {
    if (-not $env:SECURITY_ALLOWED_TARGETS) {
        $env:SECURITY_ALLOWED_TARGETS = "http://127.0.0.1:8000,http://localhost:8000"
    }
    if (-not $Revision) {
        $Revision = (& git rev-parse HEAD).Trim()
        if ($LASTEXITCODE -ne 0) { throw "Git revision detection failed." }
    }

    $arguments = @(
        "security\rikms_security_scan.py",
        "--target=$Target",
        "--environment=$Environment",
        "--mode=$Mode",
        "--revision=$Revision",
        "--output=$Output"
    )

    if (Get-Command "py" -ErrorAction SilentlyContinue) {
        & py -3.12 @arguments
    }
    elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
        & python @arguments
    }
    else {
        throw "Python 3.12 was not found through 'py' or 'python'."
    }

    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
