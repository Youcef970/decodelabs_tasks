@echo off
REM CyberAuditPro Windows Agent Launcher
REM Double-click this file to run a security audit. No PowerShell terminal needed.
REM
REM If you downloaded this from the dashboard, the API URL is already set.
REM To change the server address, edit the -ApiUrl value below.

set "SCRIPT_DIR=%~dp0"
set "PS1=%SCRIPT_DIR%run-audit.ps1"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -ApiUrl "http://localhost:5000"

if errorlevel 1 (
    echo.
    echo [!] Audit encountered an error. Try right-clicking and "Run as Administrator".
    pause
) else (
    echo.
    echo [+] Audit complete. Open the dashboard to view your report.
    pause
)
