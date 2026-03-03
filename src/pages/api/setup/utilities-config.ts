import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

const STORE_FILE = path.join(process.cwd(), "data", "baselines", "utilities-config.json");

type AnyObj = Record<string, any>;

function isObj(v: any): v is AnyObj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch)) return patch;
  if (!isObj(base) || !isObj(patch)) return patch === undefined ? base : patch;
  const out: AnyObj = { ...base };
  for (const k of Object.keys(patch)) out[k] = deepMerge(base[k], patch[k]);
  return out;
}

function toBool(v: any, fallback = false): boolean {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

function toNum(v: any, fallback = 0, min = 0, max = 1000000): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function toText(v: any, fallback = "", max = 500): string {
  return String(v ?? fallback).slice(0, max);
}

function uniqStrArr(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x || "").trim()).filter(Boolean))];
}

function defaults() {
  return {
    store: {
      enabled: false,
      panelChannelId: "",
      currencyName: "Coins",
      featuredItemIds: [] as string[],
      maxItemsPerPage: 10,
      purchaseCooldownSeconds: 3,
      refundWindowMinutes: 30,
      logsChannelId: "",
      notes: ""
    },
    ticketsPolicy: {
      enabled: true,
      requireReasonOnOpen: false,
      requireReasonOnClose: false,
      maxOpenPerUser: 1,
      cooldownSeconds: 0,
      autoCloseHours: 72,
      autoArchiveHours: 24,
      transcriptRetentionDays: 30,
      denyRoleIds: [] as string[],
      priorityRoleIds: [] as string[],
      notes: ""
    },
    selfroles: {
      enabled: false,
      panelChannelId: "",
      panelMessageId: "",
      maxRolesPerUser: 5,
      allowedRoleIds: [] as string[],
      blockedRoleIds: [] as string[],
      logsChannelId: "",
      notes: ""
    },
    persona: {
      enabled: false,
      useWebhookPersona: false,
      webhookName: "",
      webhookAvatarUrl: "",
      guildNickname: "",
      allowedChannelIds: [] as string[],
      blockedChannelIds: [] as string[],
      cooldownSeconds: 5,
      notes: ""
    },
    tts: {
      enabled: false,
      voiceDefault: "en-US",
      maxCharsPerMessage: 300,
      cooldownSeconds: 5,
      allowedChannelIds: [] as string[],
      blockedChannelIds: [] as string[],
      logsChannelId: "",
      notes: ""
    },
    radio: {
      enabled: false,
      birthdayRewardsEnabled: true,
      birthdayRewardCoins: 100,
      birthdayRoleId: "",
      announcementChannelId: "",
      dailyBonusEnabled: false,
      dailyBonusCoins: 10,
      notes: ""
    },
    loyalty: {
      enabled: false,
      autoAssignRoles: true,
      backfillOnEnable: false,
      announceChannelId: "",
      tiers: [
        { name: "30 Days", days: 30, roleId: "", rewardCoins: 50, enabled: true },
        { name: "90 Days", days: 90, roleId: "", rewardCoins: 200, enabled: true },
        { name: "365 Days", days: 365, roleId: "", rewardCoins: 1000, enabled: true }
      ],
      notes: ""
    },
    notes: ""
  };
}

function normalizeTier(t: any, i: number) {
  return {
    name: toText(t?.name, `Tier ${i + 1}`, 80),
    days: toNum(t?.days, 30, 1, 10000),
    roleId: toText(t?.roleId, "", 40),
    rewardCoins: toNum(t?.rewardCoins, 0, 0, 100000000),
    enabled: toBool(t?.enabled, true)
  };
}

function normalize(raw: any) {
  const d = defaults();
  const m = deepMerge(d, raw || {});

  return {
    store: {
      enabled: toBool(m?.store?.enabled, d.store.enabled),
      panelChannelId: toText(m?.store?.panelChannelId, "", 40),
      currencyName: toText(m?.store?.currencyName, d.store.currencyName, 40),
      featuredItemIds: uniqStrArr(m?.store?.featuredItemIds),
      maxItemsPerPage: toNum(m?.store?.maxItemsPerPage, d.store.maxItemsPerPage, 1, 200),
      purchaseCooldownSeconds: toNum(m?.store?.purchaseCooldownSeconds, d.store.purchaseCooldownSeconds, 0, 3600),
      refundWindowMinutes: toNum(m?.store?.refundWindowMinutes, d.store.refundWindowMinutes, 0, 10080),
      logsChannelId: toText(m?.store?.logsChannelId, "", 40),
      notes: toText(m?.store?.notes, "", 1000)
    },
    ticketsPolicy: {
      enabled: toBool(m?.ticketsPolicy?.enabled, d.ticketsPolicy.enabled),
      requireReasonOnOpen: toBool(m?.ticketsPolicy?.requireReasonOnOpen, d.ticketsPolicy.requireReasonOnOpen),
      requireReasonOnClose: toBool(m?.ticketsPolicy?.requireReasonOnClose, d.ticketsPolicy.requireReasonOnClose),
      maxOpenPerUser: toNum(m?.ticketsPolicy?.maxOpenPerUser, d.ticketsPolicy.maxOpenPerUser, 1, 100),
      cooldownSeconds: toNum(m?.ticketsPolicy?.cooldownSeconds, d.ticketsPolicy.cooldownSeconds, 0, 86400),
      autoCloseHours: toNum(m?.ticketsPolicy?.autoCloseHours, d.ticketsPolicy.autoCloseHours, 0, 8760),
      autoArchiveHours: toNum(m?.ticketsPolicy?.autoArchiveHours, d.ticketsPolicy.autoArchiveHours, 0, 8760),
      transcriptRetentionDays: toNum(m?.ticketsPolicy?.transcriptRetentionDays, d.ticketsPolicy.transcriptRetentionDays, 0, 3650),
      denyRoleIds: uniqStrArr(m?.ticketsPolicy?.denyRoleIds),
      priorityRoleIds: uniqStrArr(m?.ticketsPolicy?.priorityRoleIds),
      notes: toText(m?.ticketsPolicy?.notes, "", 1000)
    },
    selfroles: {
      enabled: toBool(m?.selfroles?.enabled, d.selfroles.enabled),
      panelChannelId: toText(m?.selfroles?.panelChannelId, "", 40),
      panelMessageId: toText(m?.selfroles?.panelMessageId, "", 40),
      maxRolesPerUser: toNum(m?.selfroles?.maxRolesPerUser, d.selfroles.maxRolesPerUser, 1, 100),
      allowedRoleIds: uniqStrArr(m?.selfroles?.allowedRoleIds),
      blockedRoleIds: uniqStrArr(m?.selfroles?.blockedRoleIds),
      logsChannelId: toText(m?.selfroles?.logsChannelId, "", 40),
      notes: toText(m?.selfroles?.notes, "", 1000)
    },
    persona: {
      enabled: toBool(m?.persona?.enabled, d.persona.enabled),
      useWebhookPersona: toBool(m?.persona?.useWebhookPersona, d.persona.useWebhookPersona),
      webhookName: toText(m?.persona?.webhookName, "", 80),
      webhookAvatarUrl: toText(m?.persona?.webhookAvatarUrl, "", 400),
      guildNickname: toText(m?.persona?.guildNickname, "", 80),
      allowedChannelIds: uniqStrArr(m?.persona?.allowedChannelIds),
      blockedChannelIds: uniqStrArr(m?.persona?.blockedChannelIds),
      cooldownSeconds: toNum(m?.persona?.cooldownSeconds, d.persona.cooldownSeconds, 0, 3600),
      notes: toText(m?.persona?.notes, "", 1000)
    },
    tts: {
      enabled: toBool(m?.tts?.enabled, d.tts.enabled),
      voiceDefault: toText(m?.tts?.voiceDefault, d.tts.voiceDefault, 60),
      maxCharsPerMessage: toNum(m?.tts?.maxCharsPerMessage, d.tts.maxCharsPerMessage, 1, 4000),
      cooldownSeconds: toNum(m?.tts?.cooldownSeconds, d.tts.cooldownSeconds, 0, 3600),
      allowedChannelIds: uniqStrArr(m?.tts?.allowedChannelIds),
      blockedChannelIds: uniqStrArr(m?.tts?.blockedChannelIds),
      logsChannelId: toText(m?.tts?.logsChannelId, "", 40),
      notes: toText(m?.tts?.notes, "", 1000)
    },
    radio: {
      enabled: toBool(m?.radio?.enabled, d.radio.enabled),
      birthdayRewardsEnabled: toBool(m?.radio?.birthdayRewardsEnabled, d.radio.birthdayRewardsEnabled),
      birthdayRewardCoins: toNum(m?.radio?.birthdayRewardCoins, d.radio.birthdayRewardCoins, 0, 100000000),
      birthdayRoleId: toText(m?.radio?.birthdayRoleId, "", 40),
      announcementChannelId: toText(m?.radio?.announcementChannelId, "", 40),
      dailyBonusEnabled: toBool(m?.radio?.dailyBonusEnabled, d.radio.dailyBonusEnabled),
      dailyBonusCoins: toNum(m?.radio?.dailyBonusCoins, d.radio.dailyBonusCoins, 0, 100000000),
      notes: toText(m?.radio?.notes, "", 1000)
    },
    loyalty: {
      enabled: toBool(m?.loyalty?.enabled, d.loyalty.enabled),
      autoAssignRoles: toBool(m?.loyalty?.autoAssignRoles, d.loyalty.autoAssignRoles),
      backfillOnEnable: toBool(m?.loyalty?.backfillOnEnable, d.loyalty.backfillOnEnable),
      announceChannelId: toText(m?.loyalty?.announceChannelId, "", 40),
      tiers: (Array.isArray(m?.loyalty?.tiers) && m.loyalty.tiers.length ? m.loyalty.tiers : d.loyalty.tiers).map(normalizeTier).slice(0, 30),
      notes: toText(m?.loyalty?.notes, "", 1000)
    },
    notes: toText(m?.notes, "", 3000)
  };
}

async function readStore() {
  try {
    const txt = await fs.readFile(STORE_FILE, "utf8");
    const json = JSON.parse(txt || "{}");
    return isObj(json) ? json : {};
  } catch {
    return {};
  }
}

async function writeStore(store: AnyObj) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      const store = await readStore();
      const cfg = normalize(store[guildId] || {});
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const patch = req.body?.patch ?? req.body?.config ?? req.body ?? {};
      const store = await readStore();
      const current = normalize(store[guildId] || {});
      const next = normalize(deepMerge(current, patch));

      store[guildId] = next;
      await writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
