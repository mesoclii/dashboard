import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type Config = {
  active: boolean;
  welcomeEnabled: boolean;
  goodbyeEnabled: boolean;
  welcomeChannelId: string;
  goodbyeChannelId: string;
  welcomeMessage: string;
  goodbyeMessage: string;
  sendWelcomeDm: boolean;
  welcomeDmMessage: string;
  pingOnWelcome: boolean;
  cardEnabled: boolean;
  cardBackgroundUrl: string;
  cardAccentColor: string;
  autoDeleteWelcomeSeconds: number;
  autoDeleteGoodbyeSeconds: number;
  allowedChannelIds: string[];
  notes: string;
};

const DEFAULT_CONFIG: Config = {
  active: true,
  welcomeEnabled: true,
  goodbyeEnabled: false,
  welcomeChannelId: "",
  goodbyeChannelId: "",
  welcomeMessage: "Welcome {user} to {guild}.",
  goodbyeMessage: "{userTag} left {guild}.",
  sendWelcomeDm: false,
  welcomeDmMessage: "Welcome to {guild}. Read the rules and complete onboarding.",
  pingOnWelcome: true,
  cardEnabled: true,
  cardBackgroundUrl: "",
  cardAccentColor: "#ff3b3b",
  autoDeleteWelcomeSeconds: 0,
  autoDeleteGoodbyeSeconds: 0,
  allowedChannelIds: [],
  notes: ""
};

const STORE_DIR = path.join(process.cwd(), "data", "baselines");
const STORE_FILE = path.join(STORE_DIR, "welcome-goodbye-config.json");

function isObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: any): T {
  if (!isObject(base) || !isObject(patch)) return (patch ?? base) as T;
  const out: Record<string, any> = { ...base };
  for (const k of Object.keys(patch)) {
    const b = (base as any)[k];
    const p = patch[k];
    if (Array.isArray(p)) out[k] = p;
    else if (isObject(b) && isObject(p)) out[k] = deepMerge(b, p);
    else out[k] = p;
  }
  return out as T;
}

function readStore(): Record<string, Partial<Config>> {
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Partial<Config>>) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = readStore();
      const cfg = deepMerge(DEFAULT_CONFIG, store[guildId] || {});
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as { guildId?: string; patch?: Partial<Config>; config?: Partial<Config> };
      const guildId = String(body.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const incoming = body.patch || body.config || {};
      const store = readStore();
      const current = deepMerge(DEFAULT_CONFIG, store[guildId] || {});
      const next = deepMerge(current, incoming);

      store[guildId] = next;
      writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "welcome-goodbye-config failed" });
  }
}
