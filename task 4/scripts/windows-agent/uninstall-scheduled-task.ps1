#Requires -RunAsAdministrator
<#
.SYNOPSIS
    CyberAudit Pro — Scheduled Task Uninstaller
.DESCRIPTION
    Removes the CyberAudit Pro scheduled task from Windows Task Scheduler.
    Optionally also removes the logs folder.
#>

$TaskName = "CyberAuditPro-SecurityScan"
$logDir   = Join-Path $PSScriptRoot "logs"

Write-Host ""
Write-Host "  CyberAudit Pro — Scheduled Task Uninstaller" -ForegroundColor Cyan
Write-Host "  ────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

if (-not $task) {
    Write-Host "  [!] Task '$TaskName' not found — nothing to remove." -ForegroundColor Yellow
} else {
    try {
        # Stop if currently running
        if ($task.State -eq "Running") {
            Write-Host "  [>] Stopping running task..." -ForegroundColor Cyan
            Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
        }

        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Host "  [+] Scheduled task '$TaskName' removed successfully." -ForegroundColor Green
    } catch {
        Write-Host "  [x] Failed to remove task: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# Offer to remove logs
if (Test-Path $logDir) {
    Write-Host ""
    $removeLogs = Read-Host "  Also delete the logs folder? (y/n)"
    if ($removeLogs -eq "y" -or $removeLogs -eq "Y") {
        Remove-Item -Path $logDir -Recurse -Force
        Write-Host "  [+] Logs folder removed." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  Done. The automated audit has been disabled." -ForegroundColor White
Write-Host "  You can still run audits manually: .\run-audit.ps1" -ForegroundColor DarkGray
Write-Host ""
