import type { NextApiRequest, NextApiResponse } from "next";
import {
  readGuildIdFromRequest,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";

const BOT_API = process.env.BOT_API_URL || "http://127.0.0.1:3001";
const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

function authHeaders() {
  const headers: Record<string, string> = {};
  if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;
  return headers;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = readGuildIdFromRequest(req);
    if (!guildId) {
      return res.status(400).json({ success: false, error: "Missing guildId" });
    }

    if (req.method === "GET") {
      const url = `${BOT_API}/guild-features?guildId=${encodeURIComponent(guildId)}`;
      const r = await fetch(url, { method: "GET", headers: authHeaders() });
      const data = await r.json().catch(() => ({}));
      return res.status(r.status).json(data);
    }

    if (req.method === "POST") {
      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const hasBulk = body.features && typeof body.features === "object" && !Array.isArray(body.features);

      const endpoint = hasBulk ? "/guild-features" : "/api/features/update";
      const url = `${BOT_API}${endpoint}`;

      const r = await fetch(url, {
        method: "POST",
        headers: {
          ...authHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...body, guildId }),
      });

      const data = await r.json().catch(() => ({}));
      return res.status(r.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Feature proxy failed",
    });
  }
}
