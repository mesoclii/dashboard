import type { NextApiRequest, NextApiResponse } from "next";
import {
  readGuildIdFromRequest,
  isWriteBlockedForGuild,
  stockLockError,
} from "@/lib/guildPolicy";
import { engineCatalog } from "@/lib/engineCatalog";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

const SUPPORTED_ENGINES = new Set(engineCatalog.map((engine) => engine.engineId));

function sanitizeEngineId(raw: unknown) {
  return String(raw || "").trim().replace(/[^a-zA-Z0-9._-]/g, "");
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return !!input && typeof input === "object" && !Array.isArray(input);
}

function normalizeConfigPayload(body: unknown): Record<string, unknown> | null {
  if (!isRecord(body)) return null;

  if (isRecord(body.config) && !Array.isArray(body.config)) {
    return body.config;
  }

  if (isRecord(body.patch) && !Array.isArray(body.patch)) {
    return body.patch;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    if (key === "guildId" || key === "engine") continue;
    result[key] = value;
  }
  return result;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const engine = sanitizeEngineId(
      Array.isArray(req.query.engineId) ? req.query.engineId[0] : req.query.engineId
    );
    const guildId = readGuildIdFromRequest(req);

    if (!engine) {
      return res.status(400).json({ success: false, error: "Missing or invalid engineId" });
    }
    if (!SUPPORTED_ENGINES.has(engine)) {
      return res.status(404).json({ success: false, error: "Unsupported engineId" });
    }
    if (!guildId) {
      return res.status(400).json({ success: false, error: "Missing or invalid guildId" });
    }

    if (req.method === "GET") {
      const upstream = await fetch(
        `${BOT_API}/engine-config?${new URLSearchParams({ guildId, engine }).toString()}`,
        { headers: buildBotApiHeaders(req), cache: "no-store" }
      );

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const config = normalizeConfigPayload(req.body);
      if (!isRecord(config)) {
        return res.status(400).json({ success: false, error: "Invalid config payload" });
      }

      const upstream = await fetch(`${BOT_API}/engine-config`, {
        method: req.method,
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({
          guildId,
          engine,
          config,
        }),
      });

      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json(data);
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return res.status(500).json({ success: false, error: err.message });
    }
    return res.status(500).json({ success: false, error: "Engine config proxy failed" });
  }
}
