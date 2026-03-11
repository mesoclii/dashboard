import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const PM2_DIR = process.env.PM2_LOG_DIR || "/home/ubuntu/.pm2/logs";

const DEFAULT_MAP: Record<string, string[]> = {
  "bot-out": [
    String(process.env.POSSUM_BOT_OUT_LOG || "").trim(),
    String(process.env.BOT_OUT_LOG_FILE || "").trim(),
    "possum-bot-out.log"
  ],
  "bot-error": [
    String(process.env.POSSUM_BOT_ERROR_LOG || "").trim(),
    String(process.env.BOT_ERROR_LOG_FILE || "").trim(),
    "possum-bot-error.log"
  ],
  "dash-out": [
    String(process.env.POSSUM_DASH_OUT_LOG || "").trim(),
    "possum-dashboard-out.log"
  ],
  "dash-error": [
    String(process.env.POSSUM_DASH_ERROR_LOG || "").trim(),
    "possum-dashboard-error.log"
  ]
};

function resolveFile(kind: string): string {
  const candidates = (DEFAULT_MAP[kind] || DEFAULT_MAP["dash-error"]).filter(Boolean);

  for (const f of candidates) {
    const full = path.join(PM2_DIR, f);
    if (fs.existsSync(full)) return f;
  }

  try {
    const files = fs.readdirSync(PM2_DIR);
    const suffix = kind === "bot-out"
      ? "-bot-out.log"
      : kind === "bot-error"
      ? "-bot-error.log"
      : kind === "dash-out"
      ? "-dashboard-out.log"
      : "-dashboard-error.log";
    const matched = files.find((name) => name.endsWith(suffix));
    if (matched) return matched;
  } catch {
    // ignore and use fallback
  }

  return candidates[0] || "possum-dashboard-error.log";
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const kind = String(req.query.kind || "dash-error").trim();
  const lines = Math.max(20, Math.min(2000, Number(req.query.lines || 200)));
  const file = resolveFile(kind);
  const fp = path.join(PM2_DIR, file);

  if (!fs.existsSync(fp)) {
    return res.status(200).json({ success: true, kind, file: fp, lines: [] });
  }

  const raw = fs.readFileSync(fp, "utf8");
  const arr = raw.split(/\r?\n/).filter(Boolean).slice(-lines);

  return res.status(200).json({
    success: true,
    kind,
    file: fp,
    count: arr.length,
    lines: arr
  });
}