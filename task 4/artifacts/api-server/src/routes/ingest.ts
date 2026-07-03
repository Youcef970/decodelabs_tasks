import { Router } from "express";
import { db, scansTable, findingsTable } from "@workspace/db";
import { IngestScanBody } from "@workspace/api-zod";

const router = Router();

function computeScore(findings: Array<{ severity: string }>): { score: number; grade: string } {
  let deduction = 0;
  for (const f of findings) {
    switch (f.severity) {
      case "Critical": deduction += 25; break;
      case "High":     deduction += 10; break;
      case "Medium":   deduction += 5;  break;
      case "Low":      deduction += 2;  break;
    }
  }
  const score = Math.max(0, 100 - deduction);
  let grade: string;
  if (score >= 90)      grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else                  grade = "F";
  return { score, grade };
}

/** POST /api/scan/ingest — called by the PowerShell agent */
router.post("/ingest", async (req, res): Promise<void> => {
  const parsed = IngestScanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid payload" });
    return;
  }

  const { label, systemInfo, findings } = parsed.data;
  const { score, grade } = computeScore(findings);

  const [scan] = await db
    .insert(scansTable)
    .values({ label, score, grade, systemInfo: systemInfo ?? null })
    .returning();

  if (findings.length > 0) {
    await db.insert(findingsTable).values(
      findings.map((f) => ({
        scanId: scan.id,
        title: f.title,
        description: f.description,
        severity: f.severity,
        category: f.category,
        recommendation: f.recommendation ?? null,
        evidence: f.evidence ?? null,
        cvssScore: f.cvssScore ?? null,
      }))
    );
  }

  res.status(201).json({ scanId: scan.id, score, grade, findingCount: findings.length });
});

export default router;
