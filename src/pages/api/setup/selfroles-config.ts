import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type RoleOption = {
  roleId: string;
  label: string;
  emoji: string;
  description: string;
  style: "primary" | "secondary" | "success" | "danger";
};

type Panel = {
  id: string;
  enabled: boolean;
  channelId: string;
  messageTitle: string;
  messageBody: string;
  mode: "buttons" | "select";
  maxSelectable: number;
  allowRemove: boolean;
  options: RoleOption[];
};

type SelfrolesConfig = {
  active: boolean;
  requireVerification: boolean;
  verificationRoleId: string;
  maxRolesPerUser: number;
  antiAbuseCooldownSec: number;
  logChannelId: string;
  panels: Panel[];
  notes: string;
  updatedAt: string;
};

const STORE_PATH = path.join(process.cwd(), "data", "setup", "selfroles-config.json");

function toInt(v: unknown, fallback: number): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function defaultOption(): RoleOption {
  return {
    roleId: "",
    label: "New Role",
    emoji: "",
    description: "",
    style: "secondary",
  };
}

function defaultPanel(): Panel {
  return {
    id: `panel_${Date.now()}`,
    enabled: true,
    channelId: "",
    messageTitle: "Pick Your Roles",
    messageBody: "Choose roles below.",
    mode: "buttons",
    maxSelectable: 1,
    allowRemove: true,
    options: [defaultOption()],
  };
}

function defaults(): SelfrolesConfig {
  return {
    active: true,
    requireVerification: false,
    verificationRoleId: "",
    maxRolesPerUser: 10,
    antiAbuseCooldownSec: 3,
    logChannelId: "",
    panels: [defaultPanel()],
    notes: "",
    updatedAt: "",
  };
}

function ensureDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function readStore(): Record<string, SelfrolesConfig> {
  try {
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(data: Record<string, SelfrolesConfig>) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

function normOptions(raw: any, fallback: RoleOption[]): RoleOption[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.slice(0, 100).map((x: any) => ({
    roleId: String(x?.roleId || ""),
    label: String(x?.label || "Role"),
    emoji: String(x?.emoji || ""),
    description: String(x?.description || ""),
    style: (["primary", "secondary", "success", "danger"].includes(String(x?.style)) ? x.style : "secondary"),
  }));
}

function normPanels(raw: any, fallback: Panel[]): Panel[] {
  if (!Array.isArray(raw)) return fallback;
  return raw.slice(0, 20).map((p: any, idx: number) => ({
    id: String(p?.id || `panel_${idx + 1}`),
    enabled: Boolean(p?.enabled ?? true),
    channelId: String(p?.channelId || ""),
    messageTitle: String(p?.messageTitle || "Pick Your Roles"),
    messageBody: String(p?.messageBody || "Choose roles below."),
    mode: (String(p?.mode) === "select" ? "select" : "buttons"),
    maxSelectable: toInt(p?.maxSelectable, 1),
    allowRemove: Boolean(p?.allowRemove ?? true),
    options: normOptions(p?.options, [defaultOption()]),
  }));
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const guildId = String(req.query.guildId || req.body?.guildId || "").trim();
  if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

  const store = readStore();
  const current = { ...defaults(), ...(store[guildId] || {}) };

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId, config: current });
  }

  if (req.method === "POST" || req.method === "PUT") {
    const body = req.body || {};
    const next: SelfrolesConfig = {
      ...current,
      active: Boolean(body.active ?? current.active),
      requireVerification: Boolean(body.requireVerification ?? current.requireVerification),
      verificationRoleId: String(body.verificationRoleId ?? current.verificationRoleId),
      maxRolesPerUser: toInt(body.maxRolesPerUser, current.maxRolesPerUser),
      antiAbuseCooldownSec: toInt(body.antiAbuseCooldownSec, current.antiAbuseCooldownSec),
      logChannelId: String(body.logChannelId ?? current.logChannelId),
      panels: normPanels(body.panels, current.panels),
      notes: String(body.notes ?? current.notes),
      updatedAt: new Date().toISOString(),
    };
    store[guildId] = next;
    writeStore(store);
    return res.status(200).json({ success: true, guildId, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
