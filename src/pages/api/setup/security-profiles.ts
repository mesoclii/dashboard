import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type ProfilesConfig = {
  selectedProfile: "custom" | "chill" | "balanced" | "strict" | "siege";
  lastAppliedAt: string;
  notes: string;
  lastBackup: string | null;
};

const DEFAULT_CONFIG: ProfilesConfig = {
  selectedProfile: "custom",
  lastAppliedAt: "",
  notes: "",
  lastBackup: null
};

const STORE_DIR = path.join(process.cwd(), "data", "baselines");
const STORE_FILE = path.join(STORE_DIR, "security-profiles.json");

function isObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function readStore(): Record<string, Partial<ProfilesConfig>> {
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Partial<ProfilesConfig>>) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = readStore();
      const cfg = { ...DEFAULT_CONFIG, ...(store[guildId] || {}) };
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as {
        guildId?: string;
        patch?: Partial<ProfilesConfig>;
        config?: Partial<ProfilesConfig>;
      };

      const guildId = String(body.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const incoming = body.patch || body.config || {};
      const store = readStore();
      const current = { ...DEFAULT_CONFIG, ...(store[guildId] || {}) };
      const next = { ...current, ...incoming };

      store[guildId] = next;
      writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "security-profiles failed" });
  }
}
