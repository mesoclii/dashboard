import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readActorUserId, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const guildId = String(req.query.guildId || "").trim();
  const userId = String(req.query.userId || readActorUserId(req) || "").trim();

  if (!guildId || !userId) {
    return res.status(400).json({ success: false, error: "guildId and userId are required" });
  }

  try {
    const upstream = await fetch(
      `${BOT_API}/guild-access?guildId=${encodeURIComponent(guildId)}&userId=${encodeURIComponent(userId)}`,
      {
        headers: buildBotApiHeaders(req),
        cache: "no-store",
      }
    );

    const data = await readJsonSafe(upstream);
    return res.status(upstream.status).json(data);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "Bot API unreachable",
    });
  }
}
