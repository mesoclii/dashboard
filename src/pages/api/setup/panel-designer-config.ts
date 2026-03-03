import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type AnyObj = Record<string, any>;
const DATA_FILE = path.join(process.cwd(), "data", "setup", "panel-designer-config.json");

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

function defaults() {
  const mk = (title: string, buttonLabel: string) => ({
    enabled: true,
    channelId: "",
    title,
    description: "",
    buttonLabel,
    color: "#ff3b3b",
    imageUrl: "",
    bannerUrl: "",
    layoutPreset: "clean",
    previewEnabled: true,
    style: {
      compactMode: false,
      borderGlow: true,
      rounded: 12,
      shadow: 18,
      fontScale: 1
    }
  });

  return {
    active: true,
    templates: [
      { key: "clean", title: "Clean" },
      { key: "warzone", title: "Warzone" },
      { key: "elite", title: "Elite" },
      { key: "minimal", title: "Minimal" }
    ],
    modules: {
      welcome: mk("Welcome", "Start"),
      tickets: mk("Support Tickets", "Open Ticket"),
      selfroles: mk("Pick Your Roles", "Choose Roles"),
      store: mk("Server Store", "Open Store")
    },
    notes: ""
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
      const config = deepMerge(defaults(), all[guildId] || {});
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const patch = req.body?.reset === true ? defaults() : (req.body?.patch || {});
      const all = readAll();
      const merged = deepMerge(deepMerge(defaults(), all[guildId] || {}), patch);
      all[guildId] = merged;
      writeAll(all);

      return res.status(200).json({ success: true, guildId, config: merged });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
