import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type AnyObj = Record<string, any>;
const FILE = path.join(process.cwd(), "data", "setup", "security-policy-config.json");

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
    immunityRoleIds: [],
    commandPolicy: {
      defaultAccess: "allow",
      staffBypass: true,
      allowedRoleIds: [],
      deniedRoleIds: [],
      commandRules: [
        {
          command: "tts",
          enabled: true,
          allowedRoleIds: [],
          deniedRoleIds: [],
          allowedChannelIds: [],
          deniedChannelIds: [],
          cooldownSec: 0
        }
      ]
    },
    channelRestrictions: {
      restrictedChannelIds: [],
      readOnlyChannelIds: [],
      mediaOnlyChannelIds: [],
      blockedCommandChannelIds: [],
      ignoredChannelIds: [],
      allowBotsInRestricted: false
    },
    escalation: {
      enabled: true,
      resetWindowMinutes: 15,
      warnThreshold: 3,
      muteThreshold: 5,
      timeoutThreshold: 7,
      timeoutMinutes: 10,
      kickThreshold: 10,
      banThreshold: 14,
      notifyChannelId: ""
    },
    lockdownPolicy: {
      autoLockdownEnabled: false,
      raidModeEnabled: false,
      exemptRoleIds: [],
      exemptChannelIds: [],
      lockDurationMinutes: 15
    },
    logging: {
      enabled: true,
      logChannelId: "",
      includeCommandDenials: true,
      includeChannelViolations: true,
      includeEscalationActions: true,
      includeLockdownEvents: true
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
