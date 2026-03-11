import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

type AnyObj = Record<string, any>;
const DATA_FILE = path.join(process.cwd(), "data", "setup", "store-config.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

function readAll(): AnyObj {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeAll(all: AnyObj) {
  ensureDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(all, null, 2), "utf8");
}

function defaultConfig() {
  return {
    active: true,
    panel: {
      enabled: true,
      channelId: "",
      title: "Server Store",
      description: "Spend coins on roles, perks, and items.",
      buttonLabel: "Open Store",
      embedColor: "#ff3b3b",
      imageUrl: "",
      imageLibrary: []
    },
    policies: {
      maxItemsPerPurchase: 1,
      allowRoleStacking: false,
      requireStaffApproval: false,
      logChannelId: ""
    },
    items: [
      {
        id: "vip-trial",
        name: "VIP Trial",
        description: "Temporary VIP access",
        type: "role",
        roleId: "",
        priceCoins: 5000,
        stock: -1,
        oneTime: true,
        enabled: true
      }
    ]
  };
}

function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch)) return patch;
  if (!patch || typeof patch !== "object") return patch ?? base;
  const out: AnyObj = { ...(base && typeof base === "object" ? base : {}) };
  for (const k of Object.keys(patch)) out[k] = deepMerge(out[k], patch[k]);
  return out;
}

async function readEngineConfig(req: NextApiRequest, guildId: string) {
  const upstream = await fetch(
    `${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=store`,
    { headers: buildBotApiHeaders(req), cache: "no-store" }
  );
  const data = await readJsonSafe(upstream);
  const config = data?.config && typeof data.config === "object" ? data.config : {};
  return { upstream, data, config };
}

function hasConfigPayload(config: AnyObj) {
  return Object.keys(config || {}).length > 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      const local = readAll();
      const remote = await readEngineConfig(req, guildId).catch(() => null);
      const base = remote?.config && hasConfigPayload(remote.config) ? remote.config : (local[guildId] || {});
      const config = deepMerge(defaultConfig(), base);
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const local = readAll();
      const remote = await readEngineConfig(req, guildId).catch(() => null);
      const base = remote?.config && hasConfigPayload(remote.config) ? remote.config : (local[guildId] || {});

      const patch = req.body?.reset === true ? defaultConfig() : (req.body?.patch || {});
      const merged = deepMerge(deepMerge(defaultConfig(), base), patch);
      local[guildId] = merged;
      writeAll(local);

      const upstream = await fetch(`${BOT_API}/engine-config`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({ guildId, engine: "store", config: merged })
      });
      const data = await readJsonSafe(upstream);
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          success: false,
          error: data?.error || "Failed to sync store config",
          guildId,
          config: merged
        });
      }
      return res.status(200).json({ success: true, guildId, config: data?.config || merged });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
