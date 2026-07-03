import { Router } from "express";
import { db, scansTable, findingsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import { GetScanParams, DeleteScanParams, ListScansQueryParams } from "@workspace/api-zod";

const router = Router();

/** GET /api/scans */
router.get("/", async (req, res): Promise<void> => {
  const parsed = ListScansQueryParams.safeParse(req.query);
  const limit = parsed.success ? (parsed.data.limit ?? 50) : 50;
  const offset = parsed.success ? (parsed.data.offset ?? 0) : 0;

  const scans = await db
    .select({
      id: scansTable.id,
      label: scansTable.label,
      score: scansTable.score,
      grade: scansTable.grade,
      systemInfo: scansTable.systemInfo,
      createdAt: scansTable.createdAt,
    })
    .from(scansTable)
    .orderBy(desc(scansTable.createdAt))
    .limit(limit)
    .offset(offset);

  const scanIds = scans.map((s) => s.id);
  if (scanIds.length === 0) {
    res.json([]);
    return;
  }

  const counts = await db
    .select({
      scanId: findingsTable.scanId,
      severity: findingsTable.severity,
      cnt: count(),
    })
    .from(findingsTable)
    .where(sql`${findingsTable.scanId} = ANY(ARRAY[${sql.join(scanIds.map(id => sql`${id}`), sql`, `)}]::int[])`)
    .groupBy(findingsTable.scanId, findingsTable.severity);

  const countMap: Record<number, Record<string, number>> = {};
  for (const row of counts) {
    if (!countMap[row.scanId]) countMap[row.scanId] = {};
    countMap[row.scanId][row.severity] = Number(row.cnt);
  }

  const result = scans.map((s) => {
    const sev = countMap[s.id] ?? {};
    const si = s.systemInfo as Record<string, string> | null;
    return {
      id: s.id,
      label: s.label,
      score: s.score,
      grade: s.grade,
      hostname: si?.hostname ?? null,
      os: si?.os ?? null,
      criticalCount: sev["Critical"] ?? 0,
      highCount: sev["High"] ?? 0,
      mediumCount: sev["Medium"] ?? 0,
      lowCount: sev["Low"] ?? 0,
      totalFindings: Object.values(sev).reduce((a, b) => a + b, 0),
      createdAt: s.createdAt,
    };
  });

  res.json(result);
});

/** GET /api/scans/:id */
router.get("/:id", async (req, res): Promise<void> => {
  const parsed = GetScanParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [scan] = await db
    .select()
    .from(scansTable)
    .where(eq(scansTable.id, parsed.data.id))
    .limit(1);

  if (!scan) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  const findings = await db
    .select()
    .from(findingsTable)
    .where(eq(findingsTable.scanId, scan.id))
    .orderBy(
      sql`CASE severity WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 WHEN 'Medium' THEN 3 WHEN 'Low' THEN 4 ELSE 5 END`
    );

  const sevCount = (sev: string) => findings.filter((f) => f.severity === sev).length;

  res.json({
    id: scan.id,
    label: scan.label,
    score: scan.score,
    grade: scan.grade,
    systemInfo: scan.systemInfo,
    findings,
    criticalCount: sevCount("Critical"),
    highCount: sevCount("High"),
    mediumCount: sevCount("Medium"),
    lowCount: sevCount("Low"),
    totalFindings: findings.length,
    createdAt: scan.createdAt,
  });
});

/** DELETE /api/scans/:id */
router.delete("/:id", async (req, res): Promise<void> => {
  const parsed = DeleteScanParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [existing] = await db
    .select({ id: scansTable.id })
    .from(scansTable)
    .where(eq(scansTable.id, parsed.data.id))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Scan not found" });
    return;
  }

  await db.delete(scansTable).where(eq(scansTable.id, parsed.data.id));
  res.status(204).end();
});

export default router;
