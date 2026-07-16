[CmdletBinding()]
param(
    [switch]$SkipFrontendBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Push-Location $repoRoot

try {
    foreach ($command in @("php", "composer", "node", "npm")) {
        if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
            throw "Required command '$command' was not found on PATH."
        }
    }

    $phpModules = (& php -m) -join "`n"
    foreach ($extension in @("fileinfo", "mbstring", "openssl", "pdo_sqlite", "sqlite3")) {
        if ($phpModules -notmatch "(?im)^$([regex]::Escape($extension))$") {
            throw "Required PHP extension '$extension' is not enabled in the active php.ini."
        }
    }

    $createdEnvironment = $false
    if (-not (Test-Path ".env")) {
        Copy-Item ".env.example" ".env"
        $createdEnvironment = $true
    }

    & composer install --no-interaction --prefer-dist
    if ($LASTEXITCODE -ne 0) { throw "Composer installation failed." }

    if ($createdEnvironment -or -not (Select-String -Path ".env" -Pattern "^APP_KEY=base64:" -Quiet)) {
        & php artisan key:generate
        if ($LASTEXITCODE -ne 0) { throw "Laravel key generation failed." }
    }

    if (-not (Test-Path "database\database.sqlite")) {
        New-Item -ItemType File -Path "database\database.sqlite" | Out-Null
    }

    & php artisan migrate --force
    if ($LASTEXITCODE -ne 0) { throw "Database migration failed." }

    & php artisan rikms:provision-demo
    if ($LASTEXITCODE -ne 0) { throw "Local demo provisioning failed." }

    & npm ci
    if ($LASTEXITCODE -ne 0) { throw "Frontend dependency installation failed." }

    if (-not $SkipFrontendBuild) {
        & npm run build
        if ($LASTEXITCODE -ne 0) { throw "Frontend production build failed." }
    }

    Write-Host "RIKMS local setup completed." -ForegroundColor Green
    Write-Host "Server:    php -d upload_max_filesize=25M -d post_max_size=27M artisan serve --host=127.0.0.1 --port=8000"
    Write-Host "Queue:     php artisan queue:work --queue=default,ai --tries=3"
    Write-Host "Scheduler: php artisan schedule:work"
    Write-Host "Browser:   http://127.0.0.1:8000/login"
}
finally {
    Pop-Location
}
