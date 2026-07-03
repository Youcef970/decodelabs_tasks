# CyberAudit Pro

CyberAudit Pro is a Windows security auditing platform that collects real system findings from Windows machines and displays them in a dashboard. It includes a PowerShell-based agent that runs local security checks and submits results to a local or hosted API.

## Features

- Real Windows security checks via PowerShell
- Dashboard for scan history, trends, and findings
- API for ingesting scan results and serving report data
- One-click Windows agent packaging for local audits
- Docker-based local setup for fast onboarding

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Recharts
- Backend/API: Express, TypeScript
- Database: PostgreSQL + Drizzle ORM
- Validation: Zod
- Package management: pnpm workspaces

## Project Structure

- `artifacts/api-server/` — API server
- `artifacts/cyber-audit-pro/` — frontend dashboard
- `lib/db/` — database schema and helpers
- `lib/api-spec/` — OpenAPI spec and code generation
- `scripts/windows-agent/` — PowerShell audit agent and modules

## Quick Start with Docker

Requirements:
- Docker Desktop

Run:

```bash
docker-compose up --build
```

Then open:
- Dashboard: http://localhost:5173
- API: http://localhost:5000

## Windows Agent

The Windows agent can be run from the dashboard setup page or from the local scripts folder.

For a local manual run:

```powershell
cd .\scripts\windows-agent
powershell -ExecutionPolicy Bypass -File .\run-audit.ps1 -ApiUrl "http://localhost:5000"
```

For Windows double-click usage, use:
- `run-audit.cmd` to run an audit
- `install-task.cmd` to schedule daily scans

## Development Setup

Requirements:
- Node.js 22+
- pnpm
- PostgreSQL

Install dependencies:

```bash
pnpm install
```

Create environment config:

```bash
cp .env.example .env
```

Push database schema:

```bash
pnpm --filter @workspace/db run push
```

Start the API:

```bash
pnpm --filter @workspace/api-server run dev
```

Start the dashboard:

```bash
BASE_PATH=/ PORT=5173 pnpm --filter @workspace/cyber-audit-pro run dev
```

## Security Checks Included

The agent performs 14+ real checks including:
- Identity and account auditing
- Password policy review
- Windows Defender status
- Firewall configuration
- BitLocker status
- Windows update health
- Installed software review
- Startup programs
- Running services
- Network security checks
- Browser audit
- USB policy review
- Administrator privileges
- Remote access checks

## Notes

- For full results, run the Windows agent as Administrator.
- The agent submits data to the local API only.
- Results are stored and shown in the dashboard after each scan.
