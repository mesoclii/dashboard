import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "data", "setup", "leaderboard-config.json");

function validGuildId(v: string): boolean {
  return /^\d{16,20}$/.test(String(v || "").trim());
}

function defaults() {
  return {
    active: true,
    publicEnabled: false,
    vanitySlug: "",
    pointsName: "XP",
    leaderboardType: "invites",
    rewardsEnabled: true,
    rewardTiers: [
      { invites: 5, roleId: "", coins: 0, label: "" },
      { invites: 10, roleId: "", coins: 250, label: "" },
      { invites: 25, roleId: "", coins: 1000, label: "" }
    ],
    payoutMode: "manual",
    payoutIntervalHours: 24,
    minimumInvitesForReward: 1,
    announceRewards: true,
    announceChannelId: "",
    notes: ""
  };
}

function ensureDir() {
  fs.mkdirSync(path.dirname(FILE_PATH), { recursive: true });
}

function readStore(): Record<string, any> {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const j = JSON.parse(raw || "{}");
    return j && typeof j === "object" ? j : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, any>) {
  ensureDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = String(req.method === "GET" ? req.query.guildId || "" : req.body?.guildId || "").trim();
    if (!validGuildId(guildId)) {
      return res.status(400).json({ success: false, error: "Valid guildId is required" });
    }

    const store = readStore();
    const current = { ...defaults(), ...(store[guildId] || {}) };

    if (req.method === "GET") {
      return res.status(200).json({ success: true, guildId, config: current });
    }

    if (req.method === "POST") {
      const patch = req.body?.patch && typeof req.body.patch === "object" ? req.body.patch : {};
      const next = { ...current, ...patch };
      if (!Array.isArray(next.rewardTiers)) next.rewardTiers = current.rewardTiers;
      store[guildId] = next;
      writeStore(store);
      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
