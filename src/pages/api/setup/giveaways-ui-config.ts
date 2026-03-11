import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";
import { BOT_API, buildBotApiHeaders, readJsonSafe } from "@/lib/botApi";

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

const ROOT = path.join(process.cwd(), "data", "baselines");

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
    ignoreBotEntries: true
  },
  runtime: {
    maxConcurrentGiveaways: 5,
    cooldownMinutes: 0
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
  return path.join(ROOT, `giveaways-ui.${guildId}.json`);
}

function isSnowflake(v: string): boolean {
  return /^\d{16,20}$/.test(String(v || "").trim());
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
  return s && isSnowflake(s) ? s : "";
}

function cleanIds(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  const set = new Set<string>();
  for (const item of v) {
    const id = cleanId(item);
    if (id) set.add(id);
  }
  return [...set];
}

function cleanUrl(v: unknown): string {
  const s = cleanText(v, "", 2000);
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) return "";
  return s;
}

function cleanImage(v: unknown): GiveawayImage | null {
  if (!isObj(v)) return null;
  const url = cleanUrl((v as any).url);
  if (!url) return null;
  return {
    url,
    label: cleanText((v as any).label, "", 120)
  };
}

function sanitize(input: unknown): GiveawaysUiConfig {
  const merged = mergeDeep<GiveawaysUiConfig>(DEFAULT_CONFIG, input);

  const rawLib = Array.isArray(merged.imageLibrary) ? merged.imageLibrary : [];
  const lib: GiveawayImage[] = [];
  const seen = new Set<string>();
  for (const row of rawLib) {
    const img = cleanImage(row);
    if (!img) continue;
    if (seen.has(img.url)) continue;
    seen.add(img.url);
    lib.push(img);
    if (lib.length >= 80) break;
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
    imageLibrary: lib,
    antiAbuse: {
      minAccountAgeDays: cleanInt(merged.antiAbuse?.minAccountAgeDays, 0, 0, 3650),
      ignoreBotEntries: !!merged.antiAbuse?.ignoreBotEntries
    },
    runtime: {
      maxConcurrentGiveaways: cleanInt(merged.runtime?.maxConcurrentGiveaways, 5, 1, 100),
      cooldownMinutes: cleanInt(merged.runtime?.cooldownMinutes, 0, 0, 10080)
    },
    notes: cleanText(merged.notes, "", 4000),
    lastSavedAt: cleanText(merged.lastSavedAt, "", 64)
  };
}

function readConfig(guildId: string): GiveawaysUiConfig {
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

function writeConfig(guildId: string, config: GiveawaysUiConfig) {
  ensureRoot();
  fs.writeFileSync(fileFor(guildId), JSON.stringify(config, null, 2), "utf8");
}

async function readEngineConfig(req: NextApiRequest, guildId: string) {
  const upstream = await fetch(
    `${BOT_API}/engine-config?guildId=${encodeURIComponent(guildId)}&engine=giveaways`,
    { headers: buildBotApiHeaders(req), cache: "no-store" }
  );
  const data = await readJsonSafe(upstream);
  const config = isObj(data?.config) ? (data.config as GiveawaysUiConfig) : {};
  return { upstream, data, config };
}

function hasConfigPayload(config: Record<string, unknown>) {
  return Object.keys(config || {}).length > 0;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!isSnowflake(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });
      const local = readConfig(guildId);
      const remote = await readEngineConfig(req, guildId).catch(() => null);
      const remoteCfg = remote?.config && hasConfigPayload(remote.config as any) ? remote.config : null;
      const config = sanitize(remoteCfg || local);
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || req.query.guildId || "").trim();
      if (!isSnowflake(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });

      const local = readConfig(guildId);
      const remote = await readEngineConfig(req, guildId).catch(() => null);
      const base = remote?.config && hasConfigPayload(remote.config as any) ? remote.config : local;
      const incoming = req.body?.config ?? req.body?.patch ?? {};
      const next = sanitize(mergeDeep(base, incoming));
      next.lastSavedAt = new Date().toISOString();

      writeConfig(guildId, next);

      const upstream = await fetch(`${BOT_API}/engine-config`, {
        method: "POST",
        headers: buildBotApiHeaders(req, { json: true }),
        body: JSON.stringify({ guildId, engine: "giveaways", config: next })
      });
      const data = await readJsonSafe(upstream);
      if (!upstream.ok) {
        return res.status(upstream.status).json({
          success: false,
          error: data?.error || "Failed to sync giveaways to bot",
          guildId,
          config: next
        });
      }

      return res.status(200).json({ success: true, guildId, config: data?.config || next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
