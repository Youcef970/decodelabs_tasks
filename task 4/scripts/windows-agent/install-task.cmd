@echo off
REM Install the CyberAuditPro scheduled task (runs daily at 2 AM).
REM Right-click and choose "Run as Administrator" for best results.
REM
REM This creates a Windows Task Scheduler entry so audits run automatically.
REM Use check-task-status.ps1 to verify it is active.

set "SCRIPT_DIR=%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%install-scheduled-task.ps1" -ApiUrl "http://localhost:5000"
pause
