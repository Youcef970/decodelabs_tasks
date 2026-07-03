import { Router } from "express";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";

const router = Router();

// Resolve from the *directory* of this compiled file, then go up 3 levels:
// dist/ → api-server/ → artifacts/ → project root
const agentDir = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../../..",
  "scripts/windows-agent"
);

/** Recursively add a directory into an AdmZip under the given zip prefix */
function addDirToZip(zip: AdmZip, dir: string, zipPrefix: string): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const zipPath = `${zipPrefix}/${entry.name}`;
    if (entry.isDirectory()) {
      addDirToZip(zip, fullPath, zipPath);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.addFile(zipPath, content);
    }
  }
}

/** GET /api/agent/download — streams a ZIP of the Windows agent */
router.get("/download", (req, res): void => {
  if (!fs.existsSync(agentDir)) {
    res.status(500).json({ error: "Agent scripts directory not found on server." });
    return;
  }

  // The server URL embedded in the CMD launchers so Windows knows where to POST.
  const proto = (req.headers["x-forwarded-proto"] as string) ?? "http";
  const host  = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost:5000";
  const defaultUrl = process.env["PUBLIC_URL"] ?? `${proto}://${host}`;

  const zip = new AdmZip();

  // Add every file from the agent directory
  addDirToZip(zip, agentDir, "CyberAuditPro-Agent");

  // Overwrite the CMD files with the real server URL injected
  for (const entryName of ["run-audit.cmd", "install-task.cmd"]) {
    const srcPath = path.join(agentDir, entryName);
    if (!fs.existsSync(srcPath)) continue;
    const updated = fs.readFileSync(srcPath, "utf8")
      .replace(/http:\/\/localhost:5000/g, defaultUrl);
    // Remove the static entry, add the patched one
    zip.deleteFile(`CyberAuditPro-Agent/${entryName}`);
    zip.addFile(`CyberAuditPro-Agent/${entryName}`, Buffer.from(updated, "utf8"));
  }

  const buffer = zip.toBuffer();
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="CyberAuditPro-Agent.zip"');
  res.setHeader("Content-Length", buffer.length);
  res.end(buffer);
});

export default router;
