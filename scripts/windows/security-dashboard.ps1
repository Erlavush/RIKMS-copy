[CmdletBinding()]
param(
    [string]$Target = "http://127.0.0.1:8000",
    [ValidateSet("local", "staging", "production")]
    [string]$Environment = "local",
    [int]$Port = 8888,
    [switch]$View,
    [switch]$StartApp,
    [switch]$StartOllama,
    [switch]$Code,
    [switch]$Passive,
    [switch]$AI,
    [switch]$Zap,
    [switch]$Active,
    [switch]$NoBrowser,
    [string]$AiUrl = "http://127.0.0.1:11434",
    [string]$AiModel = "qwen3.5:4b"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$appProcess = $null
$queueProcess = $null
$viteProcess = $null
$ollamaProcess = $null

function Test-TcpPort {
    param([string]$HostName, [int]$PortNumber)
    $client = [System.Net.Sockets.TcpClient]::new()
    try {
        $task = $client.ConnectAsync($HostName, $PortNumber)
        if (-not $task.Wait(350)) { return $false }
        return $client.Connected
    }
    catch { return $false }
    finally { $client.Dispose() }
}

function Wait-ForLocalApp {
    param([int]$PortNumber)
    $deadline = [DateTime]::UtcNow.AddSeconds(30)
    while ([DateTime]::UtcNow -lt $deadline) {
        if (Test-TcpPort -HostName "127.0.0.1" -PortNumber $PortNumber) { return }
        Start-Sleep -Milliseconds 350
    }
    throw "RIKMS did not become reachable on 127.0.0.1:$PortNumber within 30 seconds."
}

function Stop-ManagedProcess {
    param($Process)
    if ($null -eq $Process -or $Process.HasExited) { return }
    if (Get-Command "taskkill.exe" -ErrorAction SilentlyContinue) {
        & taskkill.exe /PID $Process.Id /T /F 2>$null | Out-Null
        return
    }
    Stop-Process -Id $Process.Id -Force -ErrorAction SilentlyContinue
}

Push-Location $repoRoot
try {
    if ($View -and ($Code -or $Passive -or $AI -or $Zap)) {
        throw "-View opens the dashboard without an initial scan. Remove -View or remove the scan switches."
    }
    if (-not $env:SECURITY_ALLOWED_TARGETS -and $Environment -eq "local") {
        $env:SECURITY_ALLOWED_TARGETS = "http://127.0.0.1:8000,http://localhost:8000"
    }
    if ($Active) {
        $env:SECURITY_ACTIVE_SCAN_ENABLED = "true"
    }

    if ($StartApp) {
        if (Test-TcpPort -HostName "127.0.0.1" -PortNumber 8000) {
            throw "Port 8000 is already in use. Stop the other Laravel server so RIKMS, Vite, the queue worker, and this dashboard all run from $repoRoot."
        }
        if (Test-TcpPort -HostName "127.0.0.1" -PortNumber 5173) {
            throw "Port 5173 is already in use. Stop the other Vite server before starting this checkout."
        }
        if (-not (Get-Command "php" -ErrorAction SilentlyContinue)) {
            throw "PHP was not found. Run scripts\windows\setup-local.ps1 first."
        }
        $npmCommand = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
        if (-not $npmCommand) {
            $npmCommand = Get-Command "npm" -ErrorAction SilentlyContinue
        }
        if (-not $npmCommand) {
            throw "npm was not found. Run scripts\windows\setup-local.ps1 first."
        }
        $appArguments = @(
            "-d", "upload_max_filesize=25M",
            "-d", "post_max_size=27M",
            "artisan", "serve",
            "--host=127.0.0.1",
            "--port=8000"
        )
        $appProcess = Start-Process -FilePath "php" -ArgumentList $appArguments -WorkingDirectory $repoRoot -PassThru
        Wait-ForLocalApp -PortNumber 8000
        $queueProcess = Start-Process -FilePath "php" -ArgumentList @(
            "artisan", "queue:work",
            "--queue=default,ai",
            "--tries=3",
            "--timeout=180"
        ) -WorkingDirectory $repoRoot -PassThru
        $viteProcess = Start-Process -FilePath $npmCommand.Source -ArgumentList @(
            "run", "dev", "--", "--host=127.0.0.1"
        ) -WorkingDirectory $repoRoot -PassThru
        Write-Host "RIKMS started at http://127.0.0.1:8000" -ForegroundColor Green
        Write-Host "Queue worker started for default,ai." -ForegroundColor Green
        Write-Host "Vite HMR started on port 5173. Do not browse port 5173; open RIKMS on port 8000." -ForegroundColor DarkGray
    }

    if ($StartOllama -and -not (Test-TcpPort -HostName "127.0.0.1" -PortNumber 11434)) {
        if (-not (Get-Command "ollama" -ErrorAction SilentlyContinue)) {
            throw "Ollama was not found. Install Ollama first or omit -StartOllama."
        }
        $ollamaProcess = Start-Process -FilePath "ollama" -ArgumentList @("serve") -WorkingDirectory $repoRoot -PassThru
        $deadline = [DateTime]::UtcNow.AddSeconds(30)
        while ([DateTime]::UtcNow -lt $deadline -and -not (Test-TcpPort -HostName "127.0.0.1" -PortNumber 11434)) {
            Start-Sleep -Milliseconds 350
        }
        if (-not (Test-TcpPort -HostName "127.0.0.1" -PortNumber 11434)) {
            throw "Ollama did not become reachable on 127.0.0.1:11434 within 30 seconds."
        }
        Write-Host "Ollama started at http://127.0.0.1:11434" -ForegroundColor Green
    }

    $labArguments = @(
        "-m", "security.lab",
        "--target=$Target",
        "--environment=$Environment",
        "--port=$Port",
        "--ai-url=$AiUrl",
        "--ai-model=$AiModel"
    )
    if ($Active) { $labArguments += "--active" }
    if ($NoBrowser) { $labArguments += "--no-browser" }
    if ($Code) { $labArguments += @("--run", "code") }
    if ($Passive) { $labArguments += @("--run", "passive") }
    if ($AI) { $labArguments += @("--run", "ai") }
    if ($Zap) { $labArguments += @("--run", "zap") }

    Write-Host "Opening Jaylord's local security workbench..." -ForegroundColor Magenta
    Write-Host "The dashboard does not require a RIKMS login. Authenticated scans still require synthetic test credentials." -ForegroundColor DarkGray

    if (Get-Command "py" -ErrorAction SilentlyContinue) {
        & py -3.12 @labArguments
    }
    elseif (Get-Command "python" -ErrorAction SilentlyContinue) {
        & python @labArguments
    }
    else {
        throw "Python 3.12 was not found through 'py' or 'python'."
    }
    exit $LASTEXITCODE
}
finally {
    Stop-ManagedProcess -Process $viteProcess
    Stop-ManagedProcess -Process $queueProcess
    Stop-ManagedProcess -Process $appProcess
    Stop-ManagedProcess -Process $ollamaProcess
    Pop-Location
}
