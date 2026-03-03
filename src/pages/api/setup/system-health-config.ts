import type { NextApiRequest, NextApiResponse } from "next";
import { promises as fs } from "fs";
import path from "path";

type SystemHealthConfig = {
  active: boolean;
  heartbeatSeconds: number;
  autoRestart: boolean;
  maxRestartsPerHour: number;
  memoryLimitMb: number;
  cpuLimitPercent: number;
  slowRequestMs: number;
  logRetentionDays: number;
  auditRetentionDays: number;
  aiContextRetentionDays: number;
  rateLimits: {
    globalPerMinute: number;
    commandPerMinute: number;
    interactionPerMinute: number;
    dashboardPerMinute: number;
  };
  jobs: {
    pokemonMinutes: number;
    catDropMinutes: number;
    rareDropMinutes: number;
    cleanupMinutes: number;
  };
  alerts: {
    channelId: string;
    mentionRoleId: string;
    onCrash: boolean;
    onHighMemory: boolean;
    onRateLimitSpike: boolean;
    onJobFailure: boolean;
  };
  notes: string;
};

const FILE = path.join(process.cwd(), "data", "setup", "system-health-config.json");

const DEFAULT_CONFIG: SystemHealthConfig = {
  active: true,
  heartbeatSeconds: 30,
  autoRestart: true,
  maxRestartsPerHour: 10,
  memoryLimitMb: 512,
  cpuLimitPercent: 90,
  slowRequestMs: 2000,
  logRetentionDays: 30,
  auditRetentionDays: 90,
  aiContextRetentionDays: 30,
  rateLimits: {
    globalPerMinute: 180,
    commandPerMinute: 60,
    interactionPerMinute: 90,
    dashboardPerMinute: 120
  },
  jobs: {
    pokemonMinutes: 20,
    catDropMinutes: 20,
    rareDropMinutes: 20,
    cleanupMinutes: 60
  },
  alerts: {
    channelId: "",
    mentionRoleId: "",
    onCrash: true,
    onHighMemory: true,
    onRateLimitSpike: true,
    onJobFailure: true
  },
  notes: ""
};

function merge(base?: Partial<SystemHealthConfig>, patch?: Partial<SystemHealthConfig>): SystemHealthConfig {
  return {
    active: Boolean(patch?.active ?? base?.active ?? DEFAULT_CONFIG.active),
    heartbeatSeconds: Number(patch?.heartbeatSeconds ?? base?.heartbeatSeconds ?? DEFAULT_CONFIG.heartbeatSeconds),
    autoRestart: Boolean(patch?.autoRestart ?? base?.autoRestart ?? DEFAULT_CONFIG.autoRestart),
    maxRestartsPerHour: Number(patch?.maxRestartsPerHour ?? base?.maxRestartsPerHour ?? DEFAULT_CONFIG.maxRestartsPerHour),
    memoryLimitMb: Number(patch?.memoryLimitMb ?? base?.memoryLimitMb ?? DEFAULT_CONFIG.memoryLimitMb),
    cpuLimitPercent: Number(patch?.cpuLimitPercent ?? base?.cpuLimitPercent ?? DEFAULT_CONFIG.cpuLimitPercent),
    slowRequestMs: Number(patch?.slowRequestMs ?? base?.slowRequestMs ?? DEFAULT_CONFIG.slowRequestMs),
    logRetentionDays: Number(patch?.logRetentionDays ?? base?.logRetentionDays ?? DEFAULT_CONFIG.logRetentionDays),
    auditRetentionDays: Number(patch?.auditRetentionDays ?? base?.auditRetentionDays ?? DEFAULT_CONFIG.auditRetentionDays),
    aiContextRetentionDays: Number(patch?.aiContextRetentionDays ?? base?.aiContextRetentionDays ?? DEFAULT_CONFIG.aiContextRetentionDays),
    rateLimits: {
      globalPerMinute: Number(patch?.rateLimits?.globalPerMinute ?? base?.rateLimits?.globalPerMinute ?? DEFAULT_CONFIG.rateLimits.globalPerMinute),
      commandPerMinute: Number(patch?.rateLimits?.commandPerMinute ?? base?.rateLimits?.commandPerMinute ?? DEFAULT_CONFIG.rateLimits.commandPerMinute),
      interactionPerMinute: Number(patch?.rateLimits?.interactionPerMinute ?? base?.rateLimits?.interactionPerMinute ?? DEFAULT_CONFIG.rateLimits.interactionPerMinute),
      dashboardPerMinute: Number(patch?.rateLimits?.dashboardPerMinute ?? base?.rateLimits?.dashboardPerMinute ?? DEFAULT_CONFIG.rateLimits.dashboardPerMinute),
    },
    jobs: {
      pokemonMinutes: Number(patch?.jobs?.pokemonMinutes ?? base?.jobs?.pokemonMinutes ?? DEFAULT_CONFIG.jobs.pokemonMinutes),
      catDropMinutes: Number(patch?.jobs?.catDropMinutes ?? base?.jobs?.catDropMinutes ?? DEFAULT_CONFIG.jobs.catDropMinutes),
      rareDropMinutes: Number(patch?.jobs?.rareDropMinutes ?? base?.jobs?.rareDropMinutes ?? DEFAULT_CONFIG.jobs.rareDropMinutes),
      cleanupMinutes: Number(patch?.jobs?.cleanupMinutes ?? base?.jobs?.cleanupMinutes ?? DEFAULT_CONFIG.jobs.cleanupMinutes),
    },
    alerts: {
      channelId: String(patch?.alerts?.channelId ?? base?.alerts?.channelId ?? DEFAULT_CONFIG.alerts.channelId),
      mentionRoleId: String(patch?.alerts?.mentionRoleId ?? base?.alerts?.mentionRoleId ?? DEFAULT_CONFIG.alerts.mentionRoleId),
      onCrash: Boolean(patch?.alerts?.onCrash ?? base?.alerts?.onCrash ?? DEFAULT_CONFIG.alerts.onCrash),
      onHighMemory: Boolean(patch?.alerts?.onHighMemory ?? base?.alerts?.onHighMemory ?? DEFAULT_CONFIG.alerts.onHighMemory),
      onRateLimitSpike: Boolean(patch?.alerts?.onRateLimitSpike ?? base?.alerts?.onRateLimitSpike ?? DEFAULT_CONFIG.alerts.onRateLimitSpike),
      onJobFailure: Boolean(patch?.alerts?.onJobFailure ?? base?.alerts?.onJobFailure ?? DEFAULT_CONFIG.alerts.onJobFailure),
    },
    notes: String(patch?.notes ?? base?.notes ?? DEFAULT_CONFIG.notes),
  };
}

async function readStore(): Promise<Record<string, SystemHealthConfig>> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Record<string, SystemHealthConfig>) {
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
      const patch = (req.body?.patch || {}) as Partial<SystemHealthConfig>;
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
