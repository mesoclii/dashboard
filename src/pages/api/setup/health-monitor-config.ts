import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type AnyObj = Record<string, any>;
const FILE = path.join(process.cwd(), "data", "setup", "health-monitor-config.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
}
function readAll(): AnyObj {
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}
function writeAll(all: AnyObj) {
  ensureDir();
  fs.writeFileSync(FILE, JSON.stringify(all, null, 2), "utf8");
}
function defaults() {
  return {
    active: true,
    runtime: {
      heartbeatSeconds: 30,
      memoryWarnMb: 512,
      memoryCriticalMb: 1024,
      cpuWarnPercent: 85,
      lagWarnMs: 250,
      staleListenerWarn: 25,
      autoSnapshotOnCrash: true
    },
    crashGuard: {
      enabled: true,
      maxRestartsPerHour: 8,
      cooldownMinutes: 5,
      quarantineModuleOnCrash: true,
      notifyChannelId: ""
    },
    rateLimit: {
      enabled: true,
      globalPerMinute: 180,
      commandPerMinute: 60,
      apiPerMinute: 120,
      burstWindowSec: 10,
      burstLimit: 20,
      exemptRoleIds: [],
      exemptChannelIds: []
    },
    moduleLoader: {
      enabled: true,
      allowHotReload: false,
      requireSignedModules: false,
      autoDisableFailingModule: true,
      modules: {
        security: true,
        economy: true,
        games: true,
        governance: true,
        ai: true,
        automation: true,
        tts: true,
        tickets: true,
        selfroles: true
      }
    },
    events: {
      enabled: true,
      trackMessageCreate: true,
      trackInteractionCreate: true,
      trackGuildMemberAdd: true,
      trackGuildMemberRemove: true,
      trackVoiceStateUpdate: true,
      trackRoleUpdate: true,
      maxListenersPerEvent: 20
    },
    logging: {
      enabled: true,
      auditChannelId: "",
      errorChannelId: "",
      perfChannelId: "",
      securityChannelId: "",
      economyChannelId: "",
      retainDays: 30,
      includeDebug: false
    },
    alerts: {
      enableDiscordAlerts: true,
      enableWebhookAlerts: false,
      webhookUrl: "",
      mentionRoleId: "",
      quietHours: "00:00-06:00"
    },
    notes: ""
  };
}
function deepMerge(base: any, patch: any): any {
  if (Array.isArray(patch)) return patch;
  if (!patch || typeof patch !== "object") return patch ?? base;
  const out: AnyObj = { ...(base && typeof base === "object" ? base : {}) };
  for (const k of Object.keys(patch)) out[k] = deepMerge(out[k], patch[k]);
  return out;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });
      const all = readAll();
      const config = deepMerge(defaults(), all[guildId] || {});
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const patch = req.body?.reset === true ? defaults() : (req.body?.patch || {});
      const all = readAll();
      const merged = deepMerge(deepMerge(defaults(), all[guildId] || {}), patch);
      all[guildId] = merged;
      writeAll(all);
      return res.status(200).json({ success: true, guildId, config: merged });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
