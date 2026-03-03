import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const AUDIT_FILE = path.join(process.cwd(), "data", "setup", "dashboard-audit.ndjson");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const guildId = String(req.query.guildId || "").trim();
  const limit = Math.max(20, Math.min(500, Number(req.query.limit || 200)));

  if (!fs.existsSync(AUDIT_FILE)) {
    return res.status(200).json({ success: true, events: [] });
  }

  const raw = fs.readFileSync(AUDIT_FILE, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const parsed = lines
    .map((line) => {
      try { return JSON.parse(line); } catch { return null; }
    })
    .filter(Boolean);

  const filtered = guildId
    ? parsed.filter((e: any) => String(e.guildId || "") === guildId)
    : parsed;

  const events = filtered.slice(-limit).reverse();
  return res.status(200).json({ success: true, events });
}
