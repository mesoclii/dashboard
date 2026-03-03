import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type CommandRule = {
  enabled: boolean;
  requiredRoleIds: string[];
  cooldownSec: number;
  logUsage: boolean;
  replyOnDeny: boolean;
  denyMessage: string;
};

type Config = {
  active: boolean;
  slashEnabled: boolean;
  prefixEnabled: boolean;
  onlyAdminsByDefault: boolean;
  allowStaffOverride: boolean;
  restrictChannelIds: string[];
  notes: string;
  commands: Record<string, CommandRule>;
};

const COMMAND_KEYS = [
  "ban",
  "kick",
  "mute",
  "unmute",
  "warn",
  "clear",
  "lock",
  "unlock",
  "slowmode",
  "timeout",
  "untimeout",
  "nickname",
  "role_add",
  "role_remove",
  "audit",
  "purge_links",
  "purge_invites",
  "quarantine",
  "release"
] as const;

function makeRule(enabled = true): CommandRule {
  return {
    enabled,
    requiredRoleIds: [],
    cooldownSec: 0,
    logUsage: true,
    replyOnDeny: true,
    denyMessage: "You do not have permission to use this command."
  };
}

const DEFAULT_CONFIG: Config = {
  active: true,
  slashEnabled: true,
  prefixEnabled: true,
  onlyAdminsByDefault: false,
  allowStaffOverride: true,
  restrictChannelIds: [],
  notes: "",
  commands: {
    ban: makeRule(true),
    kick: makeRule(true),
    mute: makeRule(true),
    unmute: makeRule(true),
    warn: makeRule(true),
    clear: makeRule(true),
    lock: makeRule(true),
    unlock: makeRule(true),
    slowmode: makeRule(true),
    timeout: makeRule(true),
    untimeout: makeRule(true),
    nickname: makeRule(true),
    role_add: makeRule(true),
    role_remove: makeRule(true),
    audit: makeRule(true),
    purge_links: makeRule(true),
    purge_invites: makeRule(true),
    quarantine: makeRule(true),
    release: makeRule(true)
  }
};

const STORE_DIR = path.join(process.cwd(), "data", "baselines");
const STORE_FILE = path.join(STORE_DIR, "security-command-config.json");

function isObject(v: unknown): v is Record<string, any> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function deepMerge<T>(base: T, patch: any): T {
  if (!isObject(base) || !isObject(patch)) return (patch ?? base) as T;
  const out: Record<string, any> = { ...base };
  for (const k of Object.keys(patch)) {
    const b = (base as any)[k];
    const p = patch[k];
    if (Array.isArray(p)) out[k] = p;
    else if (isObject(b) && isObject(p)) out[k] = deepMerge(b, p);
    else out[k] = p;
  }
  return out as T;
}

function normalize(cfg: any): Config {
  const merged = deepMerge(DEFAULT_CONFIG, cfg || {});
  if (!isObject(merged.commands)) merged.commands = { ...DEFAULT_CONFIG.commands };
  for (const key of COMMAND_KEYS) {
    merged.commands[key] = deepMerge(makeRule(true), merged.commands[key] || {});
  }
  return merged;
}

function readStore(): Record<string, Partial<Config>> {
  try {
    const raw = fs.readFileSync(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Partial<Config>>) {
  fs.mkdirSync(STORE_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = readStore();
      const config = normalize(store[guildId] || {});
      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as { guildId?: string; patch?: Partial<Config>; config?: Partial<Config> };
      const guildId = String(body.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const incoming = body.patch || body.config || {};
      const store = readStore();
      const current = normalize(store[guildId] || {});
      const next = normalize(deepMerge(current, incoming));

      store[guildId] = next;
      writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "security-command-config failed" });
  }
}
