#Requires -RunAsAdministrator
<#
.SYNOPSIS
    CyberAudit Pro — Scheduled Task Installer
.DESCRIPTION
    Installs a Windows Task Scheduler task that runs the security audit
    automatically. Supports daily, on-login, and hourly schedules.
.PARAMETER ApiUrl
    Base URL of the CyberAudit Pro API. Default: http://localhost:5000
.PARAMETER Schedule
    When to run: Daily, OnLogin, Hourly, or Weekly. Default: Daily
.PARAMETER Time
    Time for daily/weekly runs (24h format). Default: 02:00
.PARAMETER Day
    Day of week for weekly schedule. Default: Monday
.EXAMPLE
    .\install-scheduled-task.ps1
    .\install-scheduled-task.ps1 -Schedule OnLogin
    .\install-scheduled-task.ps1 -Schedule Daily -Time "09:00"
    .\install-scheduled-task.ps1 -Schedule Weekly -Day Friday -Time "18:00"
#>
param(
    [string]$ApiUrl   = "http://localhost:5000",
    [ValidateSet("Daily","OnLogin","Hourly","Weekly")]
    [string]$Schedule = "Daily",
    [string]$Time     = "02:00",
    [ValidateSet("Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday")]
    [string]$Day      = "Monday"
)

$TaskName        = "CyberAuditPro-SecurityScan"
$TaskDescription = "CyberAudit Pro automated Windows security assessment"
$scriptPath      = Join-Path $PSScriptRoot "run-audit.ps1"
$logDir          = Join-Path $PSScriptRoot "logs"
$logFile         = Join-Path $logDir "scheduled-run.log"

# Banner
Write-Host ""
Write-Host "  CyberAudit Pro — Scheduled Task Installer" -ForegroundColor Cyan
Write-Host "  ─────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

# Validate
if (-not (Test-Path $scriptPath)) {
    Write-Host "  [x] run-audit.ps1 not found at: $scriptPath" -ForegroundColor Red
    Write-Host "      Make sure you run this from the windows-agent folder." -ForegroundColor Yellow
    exit 1
}

# Create logs directory
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

# Build the action — runs PowerShell hidden with bypass, logs output
$psArgs = "-NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass " +
          "-File `"$scriptPath`" -ApiUrl `"$ApiUrl`" -Label `"Scheduled Audit`" " +
          ">> `"$logFile`" 2>&1"

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument $psArgs `
    -WorkingDirectory $PSScriptRoot

# Build trigger based on schedule choice
switch ($Schedule) {
    "Daily" {
        $timeParts = $Time -split ":"
        $triggerTime = [datetime]::Today.AddHours([int]$timeParts[0]).AddMinutes([int]$timeParts[1])
        $trigger = New-ScheduledTaskTrigger -Daily -At $triggerTime
        $scheduleDesc = "Every day at $Time"
    }
    "OnLogin" {
        $trigger = New-ScheduledTaskTrigger -AtLogOn
        $scheduleDesc = "Every time you log in"
    }
    "Hourly" {
        $trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Hours 1) -Once -At (Get-Date)
        $scheduleDesc = "Every hour"
    }
    "Weekly" {
        $timeParts = $Time -split ":"
        $triggerTime = [datetime]::Today.AddHours([int]$timeParts[0]).AddMinutes([int]$timeParts[1])
        $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek $Day -At $triggerTime
        $scheduleDesc = "Every $Day at $Time"
    }
}

# Settings — run with highest privileges, wake to run, don't stop on battery
$settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit (New-TimeSpan -Hours 1) `
    -RunOnlyIfNetworkAvailable $false `
    -StartWhenAvailable `
    -WakeToRun `
    -MultipleInstances IgnoreNew

# Principal — run as current user with highest available privileges
$principal = New-ScheduledTaskPrincipal `
    -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) `
    -LogonType Interactive `
    -RunLevel Highest

# Remove existing task if present
$existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existing) {
    Write-Host "  [!] Existing task found — replacing..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Register the task
try {
    Register-ScheduledTask `
        -TaskName $TaskName `
        -Description $TaskDescription `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Force | Out-Null

    Write-Host "  [+] Scheduled task installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Task name : $TaskName" -ForegroundColor White
    Write-Host "  Schedule  : $scheduleDesc" -ForegroundColor White
    Write-Host "  Script    : $scriptPath" -ForegroundColor White
    Write-Host "  API URL   : $ApiUrl" -ForegroundColor White
    Write-Host "  Log file  : $logFile" -ForegroundColor White
    Write-Host ""
    Write-Host "  ─────────────────────────────────────────────────────" -ForegroundColor DarkGray
    Write-Host "  To run the audit right now:" -ForegroundColor White
    Write-Host "    Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  To view in Task Scheduler:" -ForegroundColor White
    Write-Host "    taskschd.msc" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  To remove the task:" -ForegroundColor White
    Write-Host "    .\uninstall-scheduled-task.ps1" -ForegroundColor Cyan
    Write-Host ""

    # Offer to run immediately
    $runNow = Read-Host "  Run the audit right now? (y/n)"
    if ($runNow -eq "y" -or $runNow -eq "Y") {
        Write-Host ""
        Write-Host "  [>] Starting audit..." -ForegroundColor Cyan
        Start-ScheduledTask -TaskName $TaskName
        Write-Host "  [+] Audit started in background. Check the dashboard in ~30 seconds." -ForegroundColor Green
        Write-Host "      http://localhost:5173" -ForegroundColor Cyan
    }

} catch {
    Write-Host "  [x] Failed to install task: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Make sure you are running this script as Administrator." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
