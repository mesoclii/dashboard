import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type GuildPerformanceConfig = {
  lowMotionMode: boolean;
  compactCards: boolean;
  disableLivePolling: boolean;
  useVirtualLists: boolean;
  maxRowsPerList: number;
  apiTimeoutMs: number;
  dashboardCacheSec: number;
  prefetchPages: boolean;
  clientLogLevel: "silent" | "error" | "warn" | "info";
  notes: string;
  updatedAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "setup", "performance-config.json");

function defaultGuildConfig(): GuildPerformanceConfig {
  return {
    lowMotionMode: true,
    compactCards: false,
    disableLivePolling: true,
    useVirtualLists: true,
    maxRowsPerList: 100,
    apiTimeoutMs: 12000,
    dashboardCacheSec: 30,
    prefetchPages: false,
    clientLogLevel: "error",
    notes: "",
    updatedAt: "",
  };
}

function toInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function ensureDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function readStore(): Record<string, GuildPerformanceConfig> {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, GuildPerformanceConfig>) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
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
    const allowedLevels = new Set(["silent", "error", "warn", "info"]);
    const level = String(body.clientLogLevel ?? current.clientLogLevel);

    const next: GuildPerformanceConfig = {
      ...current,
      lowMotionMode: Boolean(body.lowMotionMode ?? current.lowMotionMode),
      compactCards: Boolean(body.compactCards ?? current.compactCards),
      disableLivePolling: Boolean(body.disableLivePolling ?? current.disableLivePolling),
      useVirtualLists: Boolean(body.useVirtualLists ?? current.useVirtualLists),
      maxRowsPerList: toInt(body.maxRowsPerList, current.maxRowsPerList),
      apiTimeoutMs: toInt(body.apiTimeoutMs, current.apiTimeoutMs),
      dashboardCacheSec: toInt(body.dashboardCacheSec, current.dashboardCacheSec),
      prefetchPages: Boolean(body.prefetchPages ?? current.prefetchPages),
      clientLogLevel: (allowedLevels.has(level) ? level : current.clientLogLevel) as GuildPerformanceConfig["clientLogLevel"],
      notes: String(body.notes ?? current.notes ?? ""),
      updatedAt: new Date().toISOString(),
    };

    store[guildId] = next;
    writeStore(store);
    return res.status(200).json({ success: true, guildId, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
