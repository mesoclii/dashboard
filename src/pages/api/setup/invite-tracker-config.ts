import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type RewardTier = {
  invites: number;
  roleId: string;
  coins: number;
  label: string;
  prize: string;
  oneTime: boolean;
  stackable: boolean;
};

type InviteTrackerConfig = {
  active: boolean;
  publicEnabled: boolean;
  vanitySlug: string;
  pointsName: string;
  leaderboardType: "invites" | "referrals";
  rewardsEnabled: boolean;
  rewardTiers: RewardTier[];
  payoutMode: "manual" | "auto";
  payoutIntervalHours: number;
  minimumInvitesForReward: number;
  announceRewards: boolean;
  announceChannelId: string;
  commands: {
    invite: boolean;
    invites: boolean;
    leaderboard: boolean;
  };
  fraud: {
    requireAccountAgeDays: number;
    minServerDays: number;
    ignoreBotInvites: boolean;
    lockSelfInvites: boolean;
  };
  notes: string;
  lastSavedAt: string;
};

const ROOT = path.join(process.cwd(), "data", "baselines");

const DEFAULT_CONFIG: InviteTrackerConfig = {
  active: false,
  publicEnabled: false,
  vanitySlug: "",
  pointsName: "Invites",
  leaderboardType: "invites",
  rewardsEnabled: true,
  rewardTiers: [
    { invites: 5, roleId: "", coins: 0, label: "", prize: "", oneTime: true, stackable: false },
    { invites: 10, roleId: "", coins: 250, label: "", prize: "", oneTime: true, stackable: false },
    { invites: 25, roleId: "", coins: 1000, label: "", prize: "", oneTime: true, stackable: false }
  ],
  payoutMode: "manual",
  payoutIntervalHours: 24,
  minimumInvitesForReward: 1,
  announceRewards: true,
  announceChannelId: "",
  commands: {
    invite: true,
    invites: true,
    leaderboard: true
  },
  fraud: {
    requireAccountAgeDays: 0,
    minServerDays: 0,
    ignoreBotInvites: true,
    lockSelfInvites: true
  },
  notes: "",
  lastSavedAt: ""
};

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function mergeDeep<T>(base: T, incoming: unknown): T {
  if (!isObj(base) || !isObj(incoming)) return (incoming as T) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const key of Object.keys(incoming)) {
    const nextVal = (incoming as Record<string, unknown>)[key];
    if (nextVal === undefined) continue;
    const prevVal = out[key];
    if (isObj(prevVal) && isObj(nextVal)) out[key] = mergeDeep(prevVal, nextVal);
    else out[key] = nextVal;
  }
  return out as T;
}

function ensureRoot() {
  if (!fs.existsSync(ROOT)) fs.mkdirSync(ROOT, { recursive: true });
}

function fileFor(guildId: string) {
  return path.join(ROOT, `invite-tracker.${guildId}.json`);
}

function isSnowflake(v: string): boolean {
  return /^\d{16,20}$/.test(String(v || "").trim());
}

function cleanId(v: unknown): string {
  const s = String(v || "").trim();
  return s && isSnowflake(s) ? s : "";
}

function cleanText(v: unknown, fallback: string, max = 1600): string {
  return String(v ?? fallback).trim().slice(0, max);
}

function cleanInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function cleanSlug(v: unknown): string {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function cleanTier(raw: unknown): RewardTier {
  const t = isObj(raw) ? raw : {};
  return {
    invites: cleanInt((t as any).invites, 1, 1, 1000000),
    roleId: cleanId((t as any).roleId),
    coins: cleanInt((t as any).coins, 0, 0, 100000000),
    label: cleanText((t as any).label, "", 120),
    prize: cleanText((t as any).prize, "", 240),
    oneTime: !!(t as any).oneTime,
    stackable: !!(t as any).stackable
  };
}

function sanitize(input: unknown): InviteTrackerConfig {
  const merged = mergeDeep<InviteTrackerConfig>(DEFAULT_CONFIG, input);
  const rawTiers = Array.isArray(merged.rewardTiers) ? merged.rewardTiers : [];
  const tiers = rawTiers.slice(0, 40).map(cleanTier).sort((a, b) => a.invites - b.invites);

  return {
    active: !!merged.active,
    publicEnabled: !!merged.publicEnabled,
    vanitySlug: cleanSlug(merged.vanitySlug),
    pointsName: cleanText(merged.pointsName, "Invites", 40) || "Invites",
    leaderboardType: merged.leaderboardType === "referrals" ? "referrals" : "invites",
    rewardsEnabled: !!merged.rewardsEnabled,
    rewardTiers: tiers.length ? tiers : DEFAULT_CONFIG.rewardTiers,
    payoutMode: merged.payoutMode === "auto" ? "auto" : "manual",
    payoutIntervalHours: cleanInt(merged.payoutIntervalHours, 24, 1, 720),
    minimumInvitesForReward: cleanInt(merged.minimumInvitesForReward, 1, 1, 1000000),
    announceRewards: !!merged.announceRewards,
    announceChannelId: cleanId(merged.announceChannelId),
    commands: {
      invite: !!merged.commands?.invite,
      invites: !!merged.commands?.invites,
      leaderboard: !!merged.commands?.leaderboard
    },
    fraud: {
      requireAccountAgeDays: cleanInt(merged.fraud?.requireAccountAgeDays, 0, 0, 3650),
      minServerDays: cleanInt(merged.fraud?.minServerDays, 0, 0, 3650),
      ignoreBotInvites: !!merged.fraud?.ignoreBotInvites,
      lockSelfInvites: !!merged.fraud?.lockSelfInvites
    },
    notes: cleanText(merged.notes, "", 4000),
    lastSavedAt: cleanText(merged.lastSavedAt, "", 64)
  };
}

function readConfig(guildId: string): InviteTrackerConfig {
  ensureRoot();
  const f = fileFor(guildId);
  if (!fs.existsSync(f)) return DEFAULT_CONFIG;
  try {
    const raw = fs.readFileSync(f, "utf8");
    return sanitize(JSON.parse(raw || "{}"));
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeConfig(guildId: string, config: InviteTrackerConfig) {
  ensureRoot();
  fs.writeFileSync(fileFor(guildId), JSON.stringify(config, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!isSnowflake(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });
      return res.status(200).json({ success: true, guildId, config: readConfig(guildId) });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || req.query.guildId || "").trim();
      if (!isSnowflake(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });

      const current = readConfig(guildId);
      const incoming = req.body?.config ?? req.body?.patch ?? {};
      const next = sanitize(mergeDeep(current, incoming));
      next.lastSavedAt = new Date().toISOString();
      writeConfig(guildId, next);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
