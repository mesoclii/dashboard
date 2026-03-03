import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type ModuleItem = {
  id: string;
  label: string;
  enabled: boolean;
  bootOrder: number;
  warmupMs: number;
  retryCount: number;
};

type GuildModuleLoaderConfig = {
  active: boolean;
  parallelBoot: boolean;
  maxConcurrentLoads: number;
  retryDelayMs: number;
  modules: ModuleItem[];
  notes: string;
  updatedAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "setup", "module-loader-config.json");

const BASE_MODULES: Array<{ id: string; label: string }> = [
  { id: "security", label: "Security Core" },
  { id: "onboarding", label: "Onboarding" },
  { id: "verification", label: "Verification" },
  { id: "tickets", label: "Tickets" },
  { id: "economy", label: "Economy" },
  { id: "governance", label: "Governance" },
  { id: "giveaways", label: "Giveaways" },
  { id: "games", label: "Games Core" },
  { id: "pokemon", label: "Pokemon" },
  { id: "rareDrop", label: "Rare Drop" },
  { id: "catDrop", label: "Cat Drop" },
  { id: "heist", label: "Heist" },
  { id: "crew", label: "Crew" },
  { id: "contracts", label: "Contracts" },
  { id: "dominion", label: "Dominion" },
  { id: "progression", label: "Progression" },
  { id: "automation", label: "Automation" },
  { id: "aiPersonas", label: "AI Personas" },
  { id: "tts", label: "TTS" }
];

function defaultModules(): ModuleItem[] {
  return BASE_MODULES.map((m, i) => ({
    id: m.id,
    label: m.label,
    enabled: true,
    bootOrder: i + 1,
    warmupMs: 50,
    retryCount: 2
  }));
}

function defaultGuildConfig(): GuildModuleLoaderConfig {
  return {
    active: true,
    parallelBoot: true,
    maxConcurrentLoads: 4,
    retryDelayMs: 1500,
    modules: defaultModules(),
    notes: "",
    updatedAt: ""
  };
}

function toInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function ensureDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function readStore(): Record<string, GuildModuleLoaderConfig> {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, GuildModuleLoaderConfig>) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function normalizeModules(input: unknown, fallback: ModuleItem[]): ModuleItem[] {
  if (!Array.isArray(input)) return fallback;
  const base = new Map(defaultModules().map((m) => [m.id, m]));
  const out: ModuleItem[] = [];

  for (const raw of input) {
    const id = String((raw as any)?.id || "").trim();
    if (!id) continue;
    const baseItem = base.get(id) || {
      id,
      label: String((raw as any)?.label || id),
      enabled: true,
      bootOrder: out.length + 1,
      warmupMs: 50,
      retryCount: 2
    };

    out.push({
      id,
      label: String((raw as any)?.label ?? baseItem.label),
      enabled: Boolean((raw as any)?.enabled ?? baseItem.enabled),
      bootOrder: toInt((raw as any)?.bootOrder, baseItem.bootOrder),
      warmupMs: toInt((raw as any)?.warmupMs, baseItem.warmupMs),
      retryCount: toInt((raw as any)?.retryCount, baseItem.retryCount)
    });
  }

  return out.length ? out : fallback;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
  if (!guildId) {
    return res.status(400).json({ success: false, error: "guildId is required" });
  }

  const store = readStore();
  const current = { ...defaultGuildConfig(), ...(store[guildId] || {}) };

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId, config: current });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const body = req.body || {};
    const next: GuildModuleLoaderConfig = {
      ...current,
      active: Boolean(body.active ?? current.active),
      parallelBoot: Boolean(body.parallelBoot ?? current.parallelBoot),
      maxConcurrentLoads: toInt(body.maxConcurrentLoads, current.maxConcurrentLoads),
      retryDelayMs: toInt(body.retryDelayMs, current.retryDelayMs),
      modules: normalizeModules(body.modules, current.modules || defaultModules()),
      notes: String(body.notes ?? current.notes ?? ""),
      updatedAt: new Date().toISOString()
    };

    store[guildId] = next;
    writeStore(store);
    return res.status(200).json({ success: true, guildId, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
