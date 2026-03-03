import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

type Config = {
  range: { enabled: boolean; channelId: string; cooldownSeconds: number; maxScorePerRound: number };
  truthDare: { enabled: boolean; channelId: string; truthPool: string; darePool: string };
  gunGame: { enabled: boolean; channelId: string; roundMinutes: number; respawnSeconds: number };
  carol: { enabled: boolean; channelId: string; eventMultiplier: number; bonusWindowMinutes: number };
};

const FILE = path.join(process.cwd(), "data", "setup", "fun-modes-config.json");

const DEFAULT_CONFIG: Config = {
  range: { enabled: false, channelId: "", cooldownSeconds: 10, maxScorePerRound: 100 },
  truthDare: { enabled: false, channelId: "", truthPool: "", darePool: "" },
  gunGame: { enabled: false, channelId: "", roundMinutes: 10, respawnSeconds: 5 },
  carol: { enabled: false, channelId: "", eventMultiplier: 1.0, bonusWindowMinutes: 30 },
};

function merge(base?: Partial<Config>, patch?: Partial<Config>): Config {
  return {
    range: { ...DEFAULT_CONFIG.range, ...(base?.range || {}), ...(patch?.range || {}) },
    truthDare: { ...DEFAULT_CONFIG.truthDare, ...(base?.truthDare || {}), ...(patch?.truthDare || {}) },
    gunGame: { ...DEFAULT_CONFIG.gunGame, ...(base?.gunGame || {}), ...(patch?.gunGame || {}) },
    carol: { ...DEFAULT_CONFIG.carol, ...(base?.carol || {}), ...(patch?.carol || {}) },
  };
}

async function readStore(): Promise<Record<string, Config>> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, Config>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(store, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      const store = await readStore();
      return res.status(200).json({ success: true, guildId, config: merge(store[guildId]) });
    }

    if (req.method === "POST") {
      const guildId = String(req.body?.guildId || "").trim();
      const patch = (req.body?.patch || {}) as Partial<Config>;
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = await readStore();
      const next = merge(store[guildId], patch);
      store[guildId] = next;
      await writeStore(store);
      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
