import { Router } from "express";
import { db, scansTable, findingsTable } from "@workspace/db";
import { count, avg, max, sql } from "drizzle-orm";

const router = Router();

/** GET /api/stats */
router.get("/", async (_req, res) => {
  const [summary] = await db
    .select({
      totalScans: count(),
      averageScore: avg(scansTable.score),
      lastScanAt: max(scansTable.createdAt),
    })
    .from(scansTable);

  const severityCounts = await db
    .select({
      severity: findingsTable.severity,
      cnt: count(),
    })
    .from(findingsTable)
    .groupBy(findingsTable.severity);

  const sevMap: Record<string, number> = {};
  for (const row of severityCounts) {
    sevMap[row.severity] = Number(row.cnt);
  }

  const topCategories = await db
    .select({
      category: findingsTable.category,
      cnt: count(),
    })
    .from(findingsTable)
    .groupBy(findingsTable.category)
    .orderBy(sql`count(*) DESC`)
    .limit(8);

  // Score trend — last 10 scans
  const recentScans = await db
    .select({
      score: scansTable.score,
      label: scansTable.label,
      createdAt: scansTable.createdAt,
    })
    .from(scansTable)
    .orderBy(sql`created_at DESC`)
    .limit(10);

  res.json({
    totalScans: Number(summary.totalScans),
    averageScore: summary.averageScore != null ? parseFloat(String(summary.averageScore)) : null,
    lastScanAt: summary.lastScanAt ?? null,
    totalCritical: sevMap["Critical"] ?? 0,
    totalHigh: sevMap["High"] ?? 0,
    topCategories: topCategories.map((r) => ({ category: r.category, count: Number(r.cnt) })),
    scoreTrend: recentScans.reverse().map((s) => ({
      date: s.createdAt,
      score: s.score,
      label: s.label,
    })),
  });
});

export default router;
