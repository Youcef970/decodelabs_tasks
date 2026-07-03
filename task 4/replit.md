# CyberAudit Pro

A Windows security audit dashboard. Real PowerShell agent checks 15 security areas on Windows machines and submits findings to this app — no manual terminal interaction needed.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/cyber-audit-pro run dev` — run the React dashboard (port 23492, at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned by Replit)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, Recharts, Wouter, TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM (tables: `scans`, `findings`)
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec at lib/api-spec/openapi.yaml)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for API contract
- `lib/db/src/schema/scans.ts` — DB schema (scans + findings tables)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/cyber-audit-pro/src/` — React dashboard
- `scripts/windows-agent/` — PowerShell audit modules (15 checks)

## Architecture decisions

- Windows agent submits via `POST /api/scan/ingest` — PowerShell script runs natively on Windows, calls the server
- Agent is downloadable via `GET /api/agent/download` — returns a ZIP with `.cmd` wrapper so users just double-click (no PowerShell terminal needed)
- Score is computed server-side from findings: Critical -25, High -10, Medium -5, Low -2
- systemInfo stored as JSONB on the scans table alongside the structured score/grade
- Findings are in a separate table with cascade delete

## Product

- **Dashboard** — real-time stats, score trend chart, top vulnerable categories
- **Scan History** — all scans with score, grade, finding counts
- **Report Viewer** — full scan detail: SVG ring gauge, system info panel, findings grouped by category with CVSS scores, evidence, and recommendations
- **Agent Setup** — one-click download of the Windows agent bundle (ZIP with CMD wrapper), setup instructions

## Security Assessment — Is it real?

Yes. The PowerShell modules use real Windows APIs: WMI/CIM, Get-NetFirewallProfile, Get-MpComputerStatus, Get-BitLockerVolume, Get-LocalUser, net accounts, Get-SmbShare, netstat, registry queries, etc. When run on a Windows machine, all findings reflect the actual state of that machine.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any changes to `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen` before building
- After any changes to `lib/db/src/schema/`, run `pnpm --filter @workspace/db run push`
- The archiver package is CJS-only; import via createRequire in agent.ts
- Route handlers must use `Promise<void>` return type to satisfy Express 5 TS types

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
