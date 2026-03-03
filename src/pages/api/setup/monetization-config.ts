import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

const STORE_FILE = path.join(process.cwd(), "data", "baselines", "monetization-config.json");

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

function toText(v: any, fallback = "", max = 400): string {
  const s = String(v ?? fallback);
  return s.slice(0, max);
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

function uniqStrArr(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x || "").trim()).filter(Boolean))];
}

const FEATURE_KEYS = [
  "aiPersonas",
  "tickets",
  "inviteTracker",
  "securityAutomation",
  "securityCommands",
  "moderator",
  "welcomeGoodbye",
  "giveaways",
  "leaderboard",
  "heist",
  "rareDrop",
  "pokemon",
  "tts",
  "governance",
  "economy"
] as const;

type FeatureKey = (typeof FEATURE_KEYS)[number];

function defaultConfig() {
  const featureRow = {
    enabled: false,
    planId: "starter",
    priceOverride: "",
    freeUsage: 0,
    notes: ""
  };

  const featurePricing: Record<FeatureKey, typeof featureRow> = FEATURE_KEYS.reduce((acc, k) => {
    acc[k] = { ...featureRow };
    return acc;
  }, {} as Record<FeatureKey, typeof featureRow>);

  return {
    active: false,
    currency: "USD",
    defaultPlanId: "starter",
    checkoutBaseUrl: "",
    ownerPayoutNote: "",
    plans: [
      {
        id: "starter",
        name: "Starter",
        price: "",
        cycle: "monthly",
        enabled: true,
        badge: "",
        features: ["Core premium access"]
      },
      {
        id: "pro",
        name: "Pro",
        price: "",
        cycle: "monthly",
        enabled: true,
        badge: "Most Popular",
        features: ["Higher limits", "Priority tools"]
      },
      {
        id: "elite",
        name: "Elite",
        price: "",
        cycle: "monthly",
        enabled: true,
        badge: "Best Value",
        features: ["All premium features", "Top limits"]
      }
    ],
    featurePricing,
    guildOverrides: {} as Record<string, any>,
    notes: "",
    updatedAt: ""
  };
}

function normalizePlan(p: any, i: number) {
  const cycle = ["weekly", "monthly", "yearly", "lifetime"].includes(String(p?.cycle))
    ? String(p.cycle)
    : "monthly";
  return {
    id: toText(p?.id, `plan-${i + 1}`, 64) || `plan-${i + 1}`,
    name: toText(p?.name, `Plan ${i + 1}`, 80) || `Plan ${i + 1}`,
    price: toText(p?.price, "", 40), // keep string so owner can set any format later
    cycle,
    enabled: toBool(p?.enabled, true),
    badge: toText(p?.badge, "", 60),
    features: uniqStrArr(p?.features)
  };
}

function normalizeFeatureRow(v: any, fallbackPlanId: string) {
  return {
    enabled: toBool(v?.enabled, false),
    planId: toText(v?.planId, fallbackPlanId, 64) || fallbackPlanId,
    priceOverride: toText(v?.priceOverride, "", 40),
    freeUsage: toNum(v?.freeUsage, 0, 0, 1000000),
    notes: toText(v?.notes, "", 300)
  };
}

function normalizeConfig(raw: any) {
  const base = defaultConfig();
  const merged = deepMerge(base, raw || {});

  const plansRaw = Array.isArray(merged.plans) && merged.plans.length ? merged.plans : base.plans;
  const plans = plansRaw.map(normalizePlan);
  const defaultPlanId = toText(merged.defaultPlanId, plans[0]?.id || "starter", 64) || (plans[0]?.id || "starter");

  const featurePricing: Record<FeatureKey, any> = {} as any;
  for (const key of FEATURE_KEYS) {
    featurePricing[key] = normalizeFeatureRow(merged.featurePricing?.[key], defaultPlanId);
  }

  const guildOverrides: Record<string, any> = isObj(merged.guildOverrides) ? merged.guildOverrides : {};

  return {
    active: toBool(merged.active, false),
    currency: toText(merged.currency, "USD", 10) || "USD",
    defaultPlanId,
    checkoutBaseUrl: toText(merged.checkoutBaseUrl, "", 400),
    ownerPayoutNote: toText(merged.ownerPayoutNote, "", 600),
    plans,
    featurePricing,
    guildOverrides,
    notes: toText(merged.notes, "", 2000),
    updatedAt: new Date().toISOString()
  };
}

function resolveForGuild(cfg: any, guildId: string) {
  const ov = isObj(cfg.guildOverrides?.[guildId]) ? cfg.guildOverrides[guildId] : {};
  const resolved = deepMerge(cfg, ov || {});
  return normalizeConfig(resolved);
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
      const store = await readStore();
      const cfg = normalizeConfig(store.config || {});
      const resolved = guildId ? resolveForGuild(cfg, guildId) : cfg;
      return res.status(200).json({ success: true, guildId: guildId || null, config: cfg, resolved });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const store = await readStore();
      const current = normalizeConfig(store.config || {});
      const guildId = String(req.body?.guildId || "").trim();

      if (guildId && isObj(req.body?.guildPatch)) {
        const next = { ...current };
        next.guildOverrides = isObj(next.guildOverrides) ? next.guildOverrides : {};
        const currentOv = isObj(next.guildOverrides[guildId]) ? next.guildOverrides[guildId] : {};
        next.guildOverrides[guildId] = deepMerge(currentOv, req.body.guildPatch);
        const normalized = normalizeConfig(next);
        store.config = normalized;
        await writeStore(store);
        return res.status(200).json({ success: true, guildId, config: normalized, resolved: resolveForGuild(normalized, guildId) });
      }

      const patch = req.body?.patch ?? req.body?.config ?? req.body ?? {};
      const merged = deepMerge(current, patch);
      const normalized = normalizeConfig(merged);

      store.config = normalized;
      await writeStore(store);

      return res.status(200).json({ success: true, config: normalized });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
