import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type TicketsConfig = {
  active: boolean;
  panel: {
    channelId: string;
    categoryId: string;
    transcriptChannelId: string;
    staffRoleIds: string[];
    openButtonLabel: string;
    claimButtonLabel: string;
    closeButtonLabel: string;
    deleteButtonLabel: string;
    welcomeMessageTemplate: string;
    closeMessageTemplate: string;
    pingStaffOnOpen: boolean;
    lockOnClose: boolean;
    allowUserClose: boolean;
    requireReasonOnClose: boolean;
  };
  permissions: {
    canClaimRoles: string[];
    canCloseRoles: string[];
    canDeleteRoles: string[];
    canTranscriptRoles: string[];
    userCanAddMembers: boolean;
    userCanRenameTicket: boolean;
  };
  limits: {
    maxOpenPerUser: number;
    cooldownSeconds: number;
    staleAutoArchiveHours: number;
  };
  notes: string;
};

const ROOT = path.join(process.cwd(), "data", "baselines");

const DEFAULT_CONFIG: TicketsConfig = {
  active: true,
  panel: {
    channelId: "",
    categoryId: "",
    transcriptChannelId: "",
    staffRoleIds: [],
    openButtonLabel: "Open Ticket",
    claimButtonLabel: "Claim",
    closeButtonLabel: "Close",
    deleteButtonLabel: "Delete",
    welcomeMessageTemplate: "Ticket opened by <@{{userId}}>.",
    closeMessageTemplate: "Ticket closed by <@{{actorId}}>.",
    pingStaffOnOpen: true,
    lockOnClose: true,
    allowUserClose: true,
    requireReasonOnClose: false
  },
  permissions: {
    canClaimRoles: [],
    canCloseRoles: [],
    canDeleteRoles: [],
    canTranscriptRoles: [],
    userCanAddMembers: false,
    userCanRenameTicket: false
  },
  limits: {
    maxOpenPerUser: 1,
    cooldownSeconds: 0,
    staleAutoArchiveHours: 24
  },
  notes: ""
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
  return path.join(ROOT, `tickets.${guildId}.json`);
}

function isSnowflake(v: string): boolean {
  return /^\d{16,20}$/.test(String(v || "").trim());
}

function cleanId(v: unknown): string {
  const s = String(v || "").trim();
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

function cleanText(v: unknown, fallback: string, max = 1200): string {
  const s = String(v ?? fallback).trim();
  return s.slice(0, max);
}

function cleanInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function sanitize(input: unknown): TicketsConfig {
  const merged = mergeDeep<TicketsConfig>(DEFAULT_CONFIG, input);
  return {
    active: !!merged.active,
    panel: {
      channelId: cleanId(merged.panel.channelId),
      categoryId: cleanId(merged.panel.categoryId),
      transcriptChannelId: cleanId(merged.panel.transcriptChannelId),
      staffRoleIds: cleanIds(merged.panel.staffRoleIds),
      openButtonLabel: cleanText(merged.panel.openButtonLabel, "Open Ticket", 60),
      claimButtonLabel: cleanText(merged.panel.claimButtonLabel, "Claim", 60),
      closeButtonLabel: cleanText(merged.panel.closeButtonLabel, "Close", 60),
      deleteButtonLabel: cleanText(merged.panel.deleteButtonLabel, "Delete", 60),
      welcomeMessageTemplate: cleanText(merged.panel.welcomeMessageTemplate, "Ticket opened by <@{{userId}}>.", 4000),
      closeMessageTemplate: cleanText(merged.panel.closeMessageTemplate, "Ticket closed by <@{{actorId}}>.", 4000),
      pingStaffOnOpen: !!merged.panel.pingStaffOnOpen,
      lockOnClose: !!merged.panel.lockOnClose,
      allowUserClose: !!merged.panel.allowUserClose,
      requireReasonOnClose: !!merged.panel.requireReasonOnClose
    },
    permissions: {
      canClaimRoles: cleanIds(merged.permissions.canClaimRoles),
      canCloseRoles: cleanIds(merged.permissions.canCloseRoles),
      canDeleteRoles: cleanIds(merged.permissions.canDeleteRoles),
      canTranscriptRoles: cleanIds(merged.permissions.canTranscriptRoles),
      userCanAddMembers: !!merged.permissions.userCanAddMembers,
      userCanRenameTicket: !!merged.permissions.userCanRenameTicket
    },
    limits: {
      maxOpenPerUser: cleanInt(merged.limits.maxOpenPerUser, 1, 1, 25),
      cooldownSeconds: cleanInt(merged.limits.cooldownSeconds, 0, 0, 3600),
      staleAutoArchiveHours: cleanInt(merged.limits.staleAutoArchiveHours, 24, 1, 168)
    },
    notes: cleanText(merged.notes, "", 2000)
  };
}

function readConfig(guildId: string): TicketsConfig {
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

function writeConfig(guildId: string, config: TicketsConfig) {
  ensureRoot();
  fs.writeFileSync(fileFor(guildId), JSON.stringify(config, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!isSnowflake(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });
      return res.status(200).json({ success: true, guildId, config: readConfig(guildId) });
    }

    if (req.method === "POST" || req.method === "PUT") {
      const guildId = String(req.body?.guildId || req.query.guildId || "").trim();
      if (!isSnowflake(guildId)) return res.status(400).json({ success: false, error: "guildId is required" });

      const current = readConfig(guildId);
      const incoming = req.body?.config ?? req.body?.patch ?? {};
      const next = sanitize(mergeDeep(current, incoming));
      writeConfig(guildId, next);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
