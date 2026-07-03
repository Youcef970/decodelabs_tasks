# CyberAudit Pro — Windows Security Agent

Runs real PowerShell-based security checks against your Windows machine and sends results to the CyberAudit Pro dashboard automatically.

---

## Quick Start (Manual Run)

1. Open **PowerShell as Administrator** (right-click → "Run as administrator")
2. Navigate to this folder:
   ```powershell
   cd C:\CyberAuditPro\scripts\windows-agent
   ```
3. Allow scripts (one-time setup):
   ```powershell
   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   ```
4. Run the audit:
   ```powershell
   .\run-audit.ps1
   ```
5. Open the dashboard: **http://localhost:5173**

---

## Automated Scheduling

Install the scheduled task to run audits automatically — no manual steps needed after setup.

### Install (runs every day at 2:00 AM by default)
```powershell
.\install-scheduled-task.ps1
```

### Schedule options

| Schedule | Command |
|---|---|
| Daily at 2:00 AM | `.\install-scheduled-task.ps1` |
| Daily at custom time | `.\install-scheduled-task.ps1 -Schedule Daily -Time "09:00"` |
| Every time you log in | `.\install-scheduled-task.ps1 -Schedule OnLogin` |
| Every hour | `.\install-scheduled-task.ps1 -Schedule Hourly` |
| Weekly on Friday at 6 PM | `.\install-scheduled-task.ps1 -Schedule Weekly -Day Friday -Time "18:00"` |

### Check status
```powershell
.\check-task-status.ps1
```
Shows: task state, last run time, last result code, next scheduled run, and the last 20 lines of the log file.

### Run immediately (without waiting for schedule)
```powershell
Start-ScheduledTask -TaskName "CyberAuditPro-SecurityScan"
```

### Uninstall
```powershell
.\uninstall-scheduled-task.ps1
```

---

## Script Reference

| Script | Purpose |
|---|---|
| `run-audit.ps1` | Main audit runner — executes all 15 modules |
| `install-scheduled-task.ps1` | Installs Windows Task Scheduler entry |
| `uninstall-scheduled-task.ps1` | Removes the scheduled task |
| `check-task-status.ps1` | Shows task state, last/next run, and log tail |

---

## What Gets Checked (15 Modules)

| Module | What It Checks |
|---|---|
| Identity Audit | Guest account, built-in Administrator, passwordless accounts |
| Password Policy | Min length, lockout threshold, expiry, history |
| Windows Defender | Real-time protection, AV status, signature age, SmartScreen |
| Firewall Status | All 3 profiles (Domain/Private/Public), default inbound action |
| BitLocker | Encryption status on all drives |
| Windows Updates | Pending critical/important patches, update service status |
| Installed Software | Known outdated/vulnerable apps (7-Zip, Java, Chrome, VLC, TeamViewer…) |
| Startup Programs | Suspicious registry Run keys, malicious scheduled tasks |
| Running Services | Risky services (Telnet, Remote Registry, SNMP, ICS) |
| Network Security | Open risky ports, non-default SMB shares, public DNS servers |
| Browser Audit | Outdated Chrome/Firefox/Edge versions, excessive extensions |
| USB Devices | USB storage policy, connected removable media |
| Administrator Privileges | UAC level, local admin group membership |
| Remote Access | RDP + NLA status, WinRM, OpenSSH server |
| System Information | Hostname, OS, CPU, RAM, BIOS, domain, uptime |

---

## Log Files

Scheduled runs log to: `logs\scheduled-run.log`

Each run appends a timestamped block — use `check-task-status.ps1` to view the tail, or open the file directly in Notepad.

---

## Notes

- **Run as Administrator** for full results — BitLocker, Defender, UAC, and firewall checks require elevation
- The agent sends data only to `localhost` — nothing leaves your machine
- Each module runs independently; a failure in one does not stop the others
- Results appear instantly in the dashboard after each run
