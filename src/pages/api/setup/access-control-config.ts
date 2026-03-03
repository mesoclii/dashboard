import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type AccessControlConfig = {
  active: boolean;
  ownerBypass: boolean;
  adminRoleIds: string[];
  staffRoleIds: string[];
  allowedUserIds: string[];
  deniedUserIds: string[];
  notes: string;
  updatedAt: string;
};

const DEFAULT_CONFIG: AccessControlConfig = {
  active: true,
  ownerBypass: true,
  adminRoleIds: [],
  staffRoleIds: [],
  allowedUserIds: [],
  deniedUserIds: [],
  notes: "",
  updatedAt: "",
};

const STORE_PATH = path.join(process.cwd(), "data", "setup", "access-control.json");

function ensureDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function loadStore(): Record<string, AccessControlConfig> {
  try {
    if (!fs.existsSync(STORE_PATH)) return {};
    const raw = fs.readFileSync(STORE_PATH, "utf8");
    const json = JSON.parse(raw || "{}");
    return json && typeof json === "object" ? json : {};
  } catch {
    return {};
  }
}

function saveStore(store: Record<string, AccessControlConfig>) {
  ensureDir();
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

function normArray(v: any): string[] {
  return Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];
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
  const current = { ...DEFAULT_CONFIG, ...(store[guildId] || {}) };

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId, config: current });
  }

  if (req.method === "POST") {
    const patch = req.body?.patch || {};
    const next: AccessControlConfig = {
      ...current,
      ...patch,
      active: typeof patch.active === "boolean" ? patch.active : current.active,
      ownerBypass: typeof patch.ownerBypass === "boolean" ? patch.ownerBypass : current.ownerBypass,
      adminRoleIds: patch.adminRoleIds !== undefined ? normArray(patch.adminRoleIds) : current.adminRoleIds,
      staffRoleIds: patch.staffRoleIds !== undefined ? normArray(patch.staffRoleIds) : current.staffRoleIds,
      allowedUserIds: patch.allowedUserIds !== undefined ? normArray(patch.allowedUserIds) : current.allowedUserIds,
      deniedUserIds: patch.deniedUserIds !== undefined ? normArray(patch.deniedUserIds) : current.deniedUserIds,
      notes: typeof patch.notes === "string" ? patch.notes : current.notes,
      updatedAt: new Date().toISOString(),
    };

    store[guildId] = next;
    saveStore(store);

    return res.status(200).json({ success: true, guildId, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
