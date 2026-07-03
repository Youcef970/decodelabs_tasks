#Requires -Version 5.1
param(
    [string]$ApiUrl = 'http://localhost:5000',
    [string]$Label = 'Local Windows Audit'
)

$ErrorActionPreference = 'SilentlyContinue'
$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$modulesDir = Join-Path $scriptRoot 'modules'

function Write-Step([string]$msg) {
    Write-Host "  [>] $msg" -ForegroundColor Cyan
}

function Write-OK([string]$msg) {
    Write-Host "  [+] $msg" -ForegroundColor Green
}

function Write-Warn([string]$msg) {
    Write-Host "  [!] $msg" -ForegroundColor Yellow
}

function Write-Fail([string]$msg) {
    Write-Host "  [x] $msg" -ForegroundColor Red
}

Write-Host ''
Write-Host '  CyberAudit Pro Windows Security Agent' -ForegroundColor Cyan
Write-Host '  --------------------------------------' -ForegroundColor DarkGray
Write-Host ''

$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warn 'Not running as Administrator. Some checks may be limited.'
    Write-Warn 'Right-click PowerShell and choose Run as Administrator for full results.'
    Write-Host ''
}

Write-Step "Connecting to CyberAudit Pro at $ApiUrl ..."
try {
    $healthCheck = Invoke-RestMethod -Uri "$ApiUrl/api/healthz" -Method GET -TimeoutSec 5
    if ($healthCheck.status -eq 'ok') {
        Write-OK 'API server is online.'
    }
} catch {
    Write-Fail "Cannot reach API at $ApiUrl"
    Write-Fail 'Make sure the CyberAudit Pro server is running.'
    exit 1
}

$modules = @(
    @{ name = 'Identity Audit'; script = 'identity-audit.ps1' },
    @{ name = 'Password Policy'; script = 'password-policy.ps1' },
    @{ name = 'Windows Defender'; script = 'defender.ps1' },
    @{ name = 'Firewall Status'; script = 'firewall.ps1' },
    @{ name = 'BitLocker Encryption'; script = 'bitlocker.ps1' },
    @{ name = 'Windows Updates'; script = 'windows-update.ps1' },
    @{ name = 'Installed Software'; script = 'software.ps1' },
    @{ name = 'Startup Programs'; script = 'startup.ps1' },
    @{ name = 'Running Services'; script = 'services.ps1' },
    @{ name = 'Network Security'; script = 'network.ps1' },
    @{ name = 'Browser Audit'; script = 'browser.ps1' },
    @{ name = 'USB Devices'; script = 'usb.ps1' },
    @{ name = 'Administrator Privileges'; script = 'admin-privileges.ps1' },
    @{ name = 'Remote Access'; script = 'remote-access.ps1' }
)

Write-Host ''
Write-Host "  Starting security assessment - $($modules.Count) modules" -ForegroundColor White
Write-Host '  ------------------------------------------------------------' -ForegroundColor DarkGray
Write-Host ''

Write-Step 'Collecting system information...'
$systemInfo = $null
try {
    $sysScript = Join-Path $modulesDir 'system-info.ps1'
    $raw = & powershell -NoProfile -ExecutionPolicy Bypass -File $sysScript 2>$null
    $systemInfo = $raw | ConvertFrom-Json
    Write-OK "System: $($systemInfo.hostname) - $($systemInfo.os)"
} catch {
    $systemInfo = @{
        hostname = $env:COMPUTERNAME
        os = 'Windows'
        architecture = $env:PROCESSOR_ARCHITECTURE
        cpu = $env:PROCESSOR_IDENTIFIER
        ram = 'Unknown'
        uptime = 'Unknown'
    }
}

$allFindings = @()
$completed = 0

foreach ($module in $modules) {
    $completed++
    $scriptPath = Join-Path $modulesDir $module.script
    Write-Host "  [$completed/$($modules.Count)] Scanning: $($module.name)..." -NoNewline -ForegroundColor White

    if (-not (Test-Path $scriptPath)) {
        Write-Host ' SKIPPED (module not found)' -ForegroundColor DarkGray
        continue
    }

    try {
        $raw = & powershell -NoProfile -ExecutionPolicy Bypass -File $scriptPath 2>$null
        if ($raw -and $raw.Trim() -ne '' -and $raw.Trim() -ne 'null') {
            $findings = $raw | ConvertFrom-Json
            if ($findings -is [array]) {
                $allFindings += $findings
                $count = $findings.Count
            } elseif ($findings -is [PSCustomObject]) {
                $allFindings += $findings
                $count = 1
            } else {
                $count = 0
            }

            if ($count -gt 0) {
                Write-Host " $count finding(s)" -ForegroundColor Yellow
            } else {
                Write-Host ' OK' -ForegroundColor Green
            }
        } else {
            Write-Host ' OK' -ForegroundColor Green
        }
    } catch {
        Write-Host " ERROR: $($_.Exception.Message)" -ForegroundColor Red
    }

    Start-Sleep -Milliseconds 200
}

Write-Host ''
Write-Host '  ------------------------------------------------------------' -ForegroundColor DarkGray
Write-OK "Scan complete - $($allFindings.Count) finding(s) identified"
Write-Host ''

Write-Step 'Submitting results to CyberAudit Pro...'

$payload = @{
    label = $Label
    systemInfo = $systemInfo
    findings = $allFindings
} | ConvertTo-Json -Depth 5

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/api/scan/ingest" -Method POST -ContentType 'application/json' -Body $payload -TimeoutSec 30
    Write-OK "Results saved! Scan ID: $($response.scanId), Score: $($response.score)/100 ($($response.grade))"
    Write-Host ''
    Write-Host '  Open the dashboard to view your full report:' -ForegroundColor White
    Write-Host '  http://localhost:5173' -ForegroundColor Cyan
    Write-Host ''
} catch {
    Write-Fail "Failed to submit results: $($_.Exception.Message)"
    Write-Host ''
    $findingCount = $allFindings.Count
    Write-Host ('  Findings collected locally (' + $findingCount + ' total):') -ForegroundColor Yellow
    $allFindings | ForEach-Object {
        Write-Host ('    - [' + $_.severity + '] ' + $_.title) -ForegroundColor White
    }
}
