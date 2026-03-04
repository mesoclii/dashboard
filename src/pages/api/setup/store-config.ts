import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

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

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      const all = readAll();
      const config = deepMerge(defaultConfig(), all[guildId] || {});
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const patch = req.body?.reset === true ? defaultConfig() : (req.body?.patch || {});
      const all = readAll();
      const merged = deepMerge(deepMerge(defaultConfig(), all[guildId] || {}), patch);
      all[guildId] = merged;
      writeAll(all);
      return res.status(200).json({ success: true, guildId, config: merged });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
