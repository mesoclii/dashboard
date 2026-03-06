import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  const guildId = String(req.query.guildId || "").trim();
  if (!guildId) {
    return res.status(400).json({ success: false, error: "guildId is required" });
  }

  try {
    const upstream = await fetch(
      `${BOT_API}/guild-data?guildId=${encodeURIComponent(guildId)}`,
      { headers: buildBotApiHeaders(req), cache: "no-store" }
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
