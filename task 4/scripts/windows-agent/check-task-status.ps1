<#
.SYNOPSIS
    CyberAudit Pro — Check Scheduled Task Status
.DESCRIPTION
    Shows the current status, last run, next run, and recent log output
    of the CyberAudit Pro scheduled task.
#>

$TaskName = "CyberAuditPro-SecurityScan"
$logFile  = Join-Path $PSScriptRoot "logs\scheduled-run.log"

Write-Host ""
Write-Host "  CyberAudit Pro — Task Status" -ForegroundColor Cyan
Write-Host "  ────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if (-not $task) {
    Write-Host "  [!] Scheduled task is NOT installed." -ForegroundColor Yellow
    Write-Host "      Run .\install-scheduled-task.ps1 to set it up." -ForegroundColor White
    Write-Host ""
    exit 0
}

$info = Get-ScheduledTaskInfo -TaskName $TaskName -ErrorAction SilentlyContinue

$stateColor = switch ($task.State) {
    "Running" { "Cyan" }
    "Ready"   { "Green" }
    "Disabled"{ "Yellow" }
    default   { "White" }
}

Write-Host "  Task name  : $TaskName" -ForegroundColor White
Write-Host "  State      : $($task.State)" -ForegroundColor $stateColor

if ($info) {
    $lastRun  = if ($info.LastRunTime -and $info.LastRunTime -ne [datetime]::MinValue) { $info.LastRunTime.ToString("yyyy-MM-dd HH:mm:ss") } else { "Never" }
    $nextRun  = if ($info.NextRunTime -and $info.NextRunTime -ne [datetime]::MinValue) { $info.NextRunTime.ToString("yyyy-MM-dd HH:mm:ss") } else { "Not scheduled" }
    $lastCode = $info.LastTaskResult

    $resultText = switch ($lastCode) {
        0           { "Success" }
        0x41301     { "Running" }
        0x41303     { "Task has not yet run" }
        0x41325     { "Task is currently running" }
        default     { "Code: 0x$($lastCode.ToString('X'))" }
    }
    $resultColor = if ($lastCode -eq 0) { "Green" } elseif ($lastCode -eq 0x41303) { "DarkGray" } else { "Yellow" }

    Write-Host "  Last run   : $lastRun" -ForegroundColor White
    Write-Host "  Last result: $resultText" -ForegroundColor $resultColor
    Write-Host "  Next run   : $nextRun" -ForegroundColor White
}

$trigger = $task.Triggers | Select-Object -First 1
if ($trigger) {
    Write-Host "  Schedule   : $($trigger.GetType().Name -replace 'Trigger','')" -ForegroundColor White
}

Write-Host ""
Write-Host "  ─────────────────────────────────────────────────────" -ForegroundColor DarkGray

# Show recent log output
if (Test-Path $logFile) {
    Write-Host ""
    Write-Host "  Recent log output (last 20 lines):" -ForegroundColor White
    Write-Host ""
    Get-Content $logFile -Tail 20 | ForEach-Object {
        $color = if ($_ -match "\[x\]|\[FAIL\]|ERROR") { "Red" }
                 elseif ($_ -match "\[!\]|WARN") { "Yellow" }
                 elseif ($_ -match "\[\+\]|Score:|complete") { "Green" }
                 else { "DarkGray" }
        Write-Host "    $_" -ForegroundColor $color
    }
} else {
    Write-Host ""
    Write-Host "  No log file found yet. The task has not run since installation." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  Controls:" -ForegroundColor White
Write-Host "    Run now    : Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor Cyan
Write-Host "    Stop       : Stop-ScheduledTask  -TaskName '$TaskName'" -ForegroundColor Cyan
Write-Host "    Uninstall  : .\uninstall-scheduled-task.ps1" -ForegroundColor Cyan
Write-Host ""
