import type { NextApiRequest, NextApiResponse } from "next";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";
import { isWriteBlockedForGuild, stockLockError } from "@/lib/guildPolicy";

type GiveawayImage = {
  url: string;
  label: string;
};

type GiveawaysUiConfig = {
  active: boolean;
  defaultChannelId: string;
  channelId: string;
  ticketChannelId: string;
  defaultDurationMin: number;
  defaultWinners: number;
  defaultPrize: string;
  defaultImageUrl: string;
  announceTemplate: string;
  rerollTemplate: string;
  endTemplate: string;
  requireStaffApproval: boolean;
  allowedRoleIds: string[];
  blockedRoleIds: string[];
  hostRoleIds: string[];
  allowedChannelIds: string[];
  imageLibrary: GiveawayImage[];
  antiAbuse: {
    minAccountAgeDays: number;
    ignoreBotEntries: boolean;
  };
  runtime: {
    maxConcurrentGiveaways: number;
    cooldownMinutes: number;
  };
  notes: string;
  lastSavedAt: string;
};

const DEFAULT_CONFIG: GiveawaysUiConfig = {
  active: true,
  defaultChannelId: "",
  channelId: "",
  ticketChannelId: "",
  defaultDurationMin: 60,
  defaultWinners: 1,
  defaultPrize: "",
  defaultImageUrl: "",
  announceTemplate: "Giveaway started: {{prize}}",
  rerollTemplate: "Rerolled giveaway winner for {{prize}}",
  endTemplate: "Giveaway ended: {{prize}}",
  requireStaffApproval: false,
  allowedRoleIds: [],
  blockedRoleIds: [],
  hostRoleIds: [],
  allowedChannelIds: [],
  imageLibrary: [],
  antiAbuse: {
    minAccountAgeDays: 0,
    ignoreBotEntries: true,
  },
  runtime: {
    maxConcurrentGiveaways: 5,
    cooldownMinutes: 0,
  },
  notes: "",
  lastSavedAt: "",
};

function isObj(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
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

function cleanText(v: unknown, fallback = "", max = 4000): string {
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

function cleanId(v: unknown): string {
  const s = cleanText(v, "", 30);
  return /^\d{16,20}$/.test(s) ? s : "";
}

function cleanIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((item) => cleanId(item)).filter(Boolean))];
}

function cleanUrl(v: unknown): string {
  const s = cleanText(v, "", 2000);
  return /^https?:\/\//i.test(s) ? s : "";
}

function sanitize(input: unknown): GiveawaysUiConfig {
  const merged = mergeDeep<GiveawaysUiConfig>(DEFAULT_CONFIG, input);
  const library: GiveawayImage[] = [];
  const seen = new Set<string>();
  for (const row of Array.isArray(merged.imageLibrary) ? merged.imageLibrary : []) {
    const url = cleanUrl(row?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    library.push({ url, label: cleanText(row?.label, "", 120) });
    if (library.length >= 80) break;
  }

  return {
    active: !!merged.active,
    defaultChannelId: cleanId(merged.defaultChannelId),
    channelId: cleanId(merged.channelId),
    ticketChannelId: cleanId(merged.ticketChannelId),
    defaultDurationMin: cleanInt(merged.defaultDurationMin, 60, 1, 43200),
    defaultWinners: cleanInt(merged.defaultWinners, 1, 1, 100),
    defaultPrize: cleanText(merged.defaultPrize, "", 200),
    defaultImageUrl: cleanUrl(merged.defaultImageUrl),
    announceTemplate: cleanText(merged.announceTemplate, DEFAULT_CONFIG.announceTemplate, 4000),
    rerollTemplate: cleanText(merged.rerollTemplate, DEFAULT_CONFIG.rerollTemplate, 4000),
    endTemplate: cleanText(merged.endTemplate, DEFAULT_CONFIG.endTemplate, 4000),
    requireStaffApproval: !!merged.requireStaffApproval,
    allowedRoleIds: cleanIds(merged.allowedRoleIds),
    blockedRoleIds: cleanIds(merged.blockedRoleIds),
    hostRoleIds: cleanIds(merged.hostRoleIds),
    allowedChannelIds: cleanIds(merged.allowedChannelIds),
    imageLibrary: library,
    antiAbuse: {
      minAccountAgeDays: cleanInt(merged.antiAbuse?.minAccountAgeDays, 0, 0, 3650),
      ignoreBotEntries: !!merged.antiAbuse?.ignoreBotEntries,
    },
    runtime: {
      maxConcurrentGiveaways: cleanInt(merged.runtime?.maxConcurrentGiveaways, 5, 1, 100),
      cooldownMinutes: cleanInt(merged.runtime?.cooldownMinutes, 0, 0, 10080),
    },
    notes: cleanText(merged.notes, "", 4000),
    lastSavedAt: cleanText(merged.lastSavedAt, "", 64),
  };
}

async function readRemoteConfig(req: NextApiRequest, guildId: string) {
  const upstream = await fetch(`${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=giveaways`, {
    headers: buildBotApiHeaders(req),
    cache: "no-store",
  });
  const data = await readJsonSafe(upstream);
  return {
    upstream,
    data,
    config: isObj(data?.config) ? data.config : {},
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
    if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

    if (req.method === "GET") {
      const remote = await readRemoteConfig(req, guildId);
      return res.status(remote.upstream.status).json({
        success: remote.upstream.ok,
        guildId,
        config: sanitize(remote.config),
        error: remote.data?.error,
      });
    }

    if (req.method === "POST" || req.method === "PUT") {
      if (isWriteBlockedForGuild(guildId)) {
        return res.status(403).json(stockLockError(guildId));
      }

      const remote = await readRemoteConfig(req, guildId);
      if (!remote.upstream.ok) {
        return res.status(remote.upstream.status).json(remote.data);
      }

      const incoming = req.body?.config ?? req.body?.patch ?? {};
      const next = sanitize(mergeDeep(remote.config, incoming));
      next.lastSavedAt = new Date().toISOString();

      const upstream = await fetch(`${BOT_API}/engine-config`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({ guildId, engine: "giveaways", config: next }),
      });
      const data = await readJsonSafe(upstream);
      return res.status(upstream.status).json({
        success: upstream.ok,
        guildId,
        config: sanitize(data?.config || next),
        error: data?.error,
      });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
