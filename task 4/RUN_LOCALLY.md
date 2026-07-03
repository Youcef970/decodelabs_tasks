# CyberAudit Pro — Run Locally

## Quickest start: Docker (recommended)

Requires: [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
docker-compose up --build
```

Then open **http://localhost:5173** in your browser.

The API is also accessible at **http://localhost:5000** — this is what the
Windows agent calls to submit scan results.

---

## Windows Agent — No PowerShell Terminal Needed

1. Open the dashboard at **http://localhost:5173**
2. Click **Agent Setup** in the left sidebar
3. Click **Download Windows Agent**
4. Extract the ZIP anywhere on your Windows machine
5. Double-click **`run-audit.cmd`** — that's it

The audit runs silently and results appear in the dashboard automatically.

> For full results (BitLocker, Defender, UAC), right-click `run-audit.cmd`
> and choose **Run as administrator**.

### Schedule automatic scans

To run audits automatically every day at 2 AM:

1. Right-click **`install-task.cmd`** and choose **Run as administrator**

That's all — no more manual steps. Use `check-task-status.ps1` to verify
the scheduled task is running.

---

## Multi-machine setup

If you want to audit multiple Windows machines from one dashboard:

1. Find your host machine's LAN IP (e.g. `192.168.1.10`)
2. Set `PUBLIC_URL` in your `.env` before starting Docker:
   ```bash
   PUBLIC_URL=http://192.168.1.10:5000 docker-compose up --build
   ```
3. Download the agent on each Windows machine — the `.cmd` files will
   already point to the right API address

---

## Manual / development setup

Requires: Node.js 22+, pnpm, PostgreSQL

```bash
# Install dependencies
pnpm install

# Create .env from the example
cp .env.example .env
# Edit .env and set DATABASE_URL to your local Postgres instance

# Push database schema
pnpm --filter @workspace/db run push

# Start API server (port 5000)
pnpm --filter @workspace/api-server run dev

# In another terminal — start the dashboard (port 5173)
BASE_PATH=/ PORT=5173 pnpm --filter @workspace/cyber-audit-pro run dev
```

Open **http://localhost:5173**

---

## What gets checked (15 security modules)

| Module | What it checks |
|---|---|
| Identity Audit | Guest account, built-in Administrator, passwordless accounts |
| Password Policy | Min length, lockout threshold, expiry, history |
| Windows Defender | Real-time protection, AV status, signature age, SmartScreen |
| Firewall Status | All 3 profiles (Domain/Private/Public), default inbound action |
| BitLocker | Encryption status on all drives |
| Windows Updates | Pending critical/important patches, update service status |
| Installed Software | Known outdated/vulnerable apps (Java, Chrome, TeamViewer…) |
| Startup Programs | Suspicious registry Run keys, malicious scheduled tasks |
| Running Services | Risky services (Telnet, Remote Registry, SNMP…) |
| Network Security | Open risky ports, non-default SMB shares, public DNS |
| Browser Audit | Outdated Chrome/Firefox/Edge, excessive extensions |
| USB Devices | USB storage policy, connected removable media |
| Administrator Privileges | UAC level, local admin group membership |
| Remote Access | RDP + NLA status, WinRM, OpenSSH server |
| System Information | Hostname, OS, CPU, RAM, BIOS, domain, uptime |

All checks use real Windows APIs — results reflect the actual security
state of the machine.
