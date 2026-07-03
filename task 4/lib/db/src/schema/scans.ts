import { pgTable, serial, text, integer, real, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scansTable = pgTable("scans", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  score: integer("score").notNull().default(0),
  grade: text("grade").notNull().default("F"),
  systemInfo: jsonb("system_info"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const findingsTable = pgTable("findings", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull().references(() => scansTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").notNull(), // Critical, High, Medium, Low
  category: text("category").notNull(),
  recommendation: text("recommendation"),
  evidence: text("evidence"),
  cvssScore: real("cvss_score"),
});

export const insertScanSchema = createInsertSchema(scansTable).omit({ id: true, createdAt: true });
export const insertFindingSchema = createInsertSchema(findingsTable).omit({ id: true });

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scansTable.$inferSelect;
export type InsertFinding = z.infer<typeof insertFindingSchema>;
export type Finding = typeof findingsTable.$inferSelect;
