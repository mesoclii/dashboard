import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readActorUserId } from "@/lib/botApi";

function readParam(req: NextApiRequest, key: string): string {
  const v = req.query[key];
  return String(Array.isArray(v) ? v[0] : v || "").trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = readParam(req, "guildId");
    const userId = readParam(req, "userId") || readActorUserId(req);

    if (!guildId) {
      return res.status(400).json({ success: false, error: "Missing guildId" });
    }

    const url = new URL(`${BOT_API}/guild-data`);
    url.searchParams.set("guildId", guildId);
    if (userId) url.searchParams.set("userId", userId);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: buildBotApiHeaders(req)
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    return res.status(response.status).json(data);
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Proxy failed"
    });
  }
}
