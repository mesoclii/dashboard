import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type TriggerType = "member_join" | "message_create" | "reaction_add" | "voice_join" | "role_add";
type ConditionType = "has_role" | "lacks_role" | "channel_is" | "account_age_days" | "message_contains" | "invite_code";
type ActionType = "send_message" | "dm_user" | "give_role" | "remove_role" | "timeout" | "kick" | "ban" | "log";

type RuleCondition = {
  id: string;
  type: ConditionType;
  value: string;
  negate: boolean;
};

type RuleAction = {
  id: string;
  type: ActionType;
  targetId: string;
  message: string;
  delaySec: number;
};

type AutomationRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  trigger: {
    type: TriggerType;
    channels: string[];
    keywords: string[];
    cooldownSec: number;
  };
  conditions: RuleCondition[];
  actions: RuleAction[];
  retry: {
    enabled: boolean;
    maxAttempts: number;
    delaySec: number;
  };
  stopOnFail: boolean;
};

type AutomationStudioConfig = {
  active: boolean;
  dryRun: boolean;
  maxRunsPerMinute: number;
  logChannelId: string;
  rules: AutomationRule[];
  notes: string;
  updatedAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "setup", "security-automation-studio.json");

const TRIGGERS: TriggerType[] = ["member_join", "message_create", "reaction_add", "voice_join", "role_add"];
const CONDITIONS: ConditionType[] = ["has_role", "lacks_role", "channel_is", "account_age_days", "message_contains", "invite_code"];
const ACTIONS: ActionType[] = ["send_message", "dm_user", "give_role", "remove_role", "timeout", "kick", "ban", "log"];

const DEFAULT_CONFIG: AutomationStudioConfig = {
  active: true,
  dryRun: false,
  maxRunsPerMinute: 120,
  logChannelId: "",
  rules: [],
  notes: "",
  updatedAt: "",
};

function ensureDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function loadStore(): Record<string, AutomationStudioConfig> {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const json = JSON.parse(raw || "{}");
    return json && typeof json === "object" ? json : {};
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, AutomationStudioConfig>) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function asBool(v: any, d: boolean): boolean {
  return typeof v === "boolean" ? v : d;
}
function asNum(v: any, d: number, min?: number, max?: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return d;
  let out = n;
  if (typeof min === "number" && out < min) out = min;
  if (typeof max === "number" && out > max) out = max;
  return out;
}
function asStr(v: any, d = ""): string {
  return typeof v === "string" ? v : d;
}
function asArr(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
}
function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

function cleanCondition(c: any): RuleCondition {
  const t = CONDITIONS.includes(c?.type) ? c.type : "message_contains";
  return {
    id: asStr(c?.id, id("cond")),
    type: t,
    value: asStr(c?.value, ""),
    negate: asBool(c?.negate, false),
  };
}

function cleanAction(a: any): RuleAction {
  const t = ACTIONS.includes(a?.type) ? a.type : "send_message";
  return {
    id: asStr(a?.id, id("act")),
    type: t,
    targetId: asStr(a?.targetId, ""),
    message: asStr(a?.message, ""),
    delaySec: asNum(a?.delaySec, 0, 0, 3600),
  };
}

function cleanRule(r: any, idx: number): AutomationRule {
  const triggerType: TriggerType = TRIGGERS.includes(r?.trigger?.type) ? r.trigger.type : "message_create";
  return {
    id: asStr(r?.id, id("rule")),
    name: asStr(r?.name, `Rule ${idx + 1}`),
    enabled: asBool(r?.enabled, true),
    priority: asNum(r?.priority, 50, 1, 1000),
    trigger: {
      type: triggerType,
      channels: asArr(r?.trigger?.channels).slice(0, 100),
      keywords: asArr(r?.trigger?.keywords).slice(0, 100),
      cooldownSec: asNum(r?.trigger?.cooldownSec, 0, 0, 3600),
    },
    conditions: Array.isArray(r?.conditions) ? r.conditions.map(cleanCondition).slice(0, 50) : [],
    actions: Array.isArray(r?.actions) ? r.actions.map(cleanAction).slice(0, 50) : [],
    retry: {
      enabled: asBool(r?.retry?.enabled, false),
      maxAttempts: asNum(r?.retry?.maxAttempts, 1, 1, 10),
      delaySec: asNum(r?.retry?.delaySec, 1, 0, 3600),
    },
    stopOnFail: asBool(r?.stopOnFail, true),
  };
}

function merge(current: AutomationStudioConfig, patch: any): AutomationStudioConfig {
  const p = patch || {};
  const next: AutomationStudioConfig = {
    ...current,
    active: asBool(p.active, current.active),
    dryRun: asBool(p.dryRun, current.dryRun),
    maxRunsPerMinute: asNum(p.maxRunsPerMinute, current.maxRunsPerMinute, 1, 100000),
    logChannelId: asStr(p.logChannelId, current.logChannelId),
    rules: Array.isArray(p.rules) ? p.rules.map(cleanRule).slice(0, 200) : current.rules,
    notes: asStr(p.notes, current.notes),
    updatedAt: new Date().toISOString(),
  };
  return next;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId =
    req.method === "GET"
      ? String(req.query.guildId || "").trim()
      : String(req.body?.guildId || "").trim();

  if (!guildId) {
    return res.status(400).json({ success: false, error: "guildId is required" });
  }

  const store = loadStore();
  const current: AutomationStudioConfig = { ...DEFAULT_CONFIG, ...(store[guildId] || {}) };

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId, config: current });
  }

  if (req.method === "POST") {
    const next = merge(current, req.body?.patch || {});
    store[guildId] = next;
    saveStore(store);
    return res.status(200).json({ success: true, guildId, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
