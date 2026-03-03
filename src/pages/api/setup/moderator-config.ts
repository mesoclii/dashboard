import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type ModeratorLogging = {
  logChannelId: string;
  memberMuted: boolean;
  memberUnmuted: boolean;
  moderationBan: boolean;
  moderationWarn: boolean;
  messageUpdated: boolean;
  messageDeleted: boolean;
  invitePosted: boolean;
  memberRoleChanged: boolean;
  memberJoined: boolean;
  memberLeft: boolean;
  channelCreated: boolean;
  channelUpdated: boolean;
  channelDeleted: boolean;
  serverUpdated: boolean;
  ignoreChannelIds: string[];
  dontLogBotActions: boolean;
  dontDisplayThumbnails: boolean;
};

type ModeratorAutomod = {
  enabled: boolean;
  badWordsAction: string;
  spamAction: string;
  capsAction: string;
  linksAction: string;
  mentionAction: string;
  zalgoAction: string;
  spamThreshold: number;
  capsThreshold: number;
  mentionThreshold: number;
  blockedWords: string[];
  restrictedChannelIds: string[];
  autoModerateIgnoresBots: boolean;
  sendWarningMessage: boolean;
  replyToDeletion: boolean;
};

type ModeratorConfig = {
  active: boolean;
  adminRoleIds: string[];
  immunityRoleIds: string[];
  logging: ModeratorLogging;
  automod: ModeratorAutomod;
};

const DATA_DIR = path.join(process.cwd(), "data", "baselines");
const FILE_PATH = path.join(DATA_DIR, "moderator-config.json");

const DEFAULT_CONFIG: ModeratorConfig = {
  active: true,
  adminRoleIds: [],
  immunityRoleIds: [],
  logging: {
    logChannelId: "",
    memberMuted: true,
    memberUnmuted: true,
    moderationBan: true,
    moderationWarn: true,
    messageUpdated: true,
    messageDeleted: true,
    invitePosted: true,
    memberRoleChanged: true,
    memberJoined: true,
    memberLeft: true,
    channelCreated: true,
    channelUpdated: true,
    channelDeleted: true,
    serverUpdated: true,
    ignoreChannelIds: [],
    dontLogBotActions: true,
    dontDisplayThumbnails: false
  },
  automod: {
    enabled: false,
    badWordsAction: "Delete Message + Warn Member",
    spamAction: "Delete Message",
    capsAction: "Delete Message",
    linksAction: "Disabled",
    mentionAction: "Delete Message",
    zalgoAction: "Disabled",
    spamThreshold: 5,
    capsThreshold: 70,
    mentionThreshold: 5,
    blockedWords: [],
    restrictedChannelIds: [],
    autoModerateIgnoresBots: true,
    sendWarningMessage: true,
    replyToDeletion: false
  }
};

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge<T>(base: T, patch: any): T {
  if (!isObject(base) || !isObject(patch)) {
    return (patch ?? base) as T;
  }
  const out: Record<string, any> = { ...base };
  for (const key of Object.keys(patch)) {
    const b = (base as any)[key];
    const p = patch[key];
    if (Array.isArray(p)) {
      out[key] = p;
    } else if (isObject(b) && isObject(p)) {
      out[key] = deepMerge(b, p);
    } else {
      out[key] = p;
    }
  }
  return out as T;
}

function ensureStoreDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readStore(): Record<string, Partial<ModeratorConfig>> {
  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, Partial<ModeratorConfig>>) {
  ensureStoreDir();
  fs.writeFileSync(FILE_PATH, JSON.stringify(store, null, 2), "utf8");
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      const store = readStore();
      const saved = store[guildId] || {};
      const config = deepMerge(DEFAULT_CONFIG, saved);

      return res.status(200).json({ success: true, guildId, config });
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as {
        guildId?: string;
        patch?: Partial<ModeratorConfig>;
        config?: Partial<ModeratorConfig>;
      };

      const guildId = String(body.guildId || "").trim();
      if (!guildId) {
        return res.status(400).json({ success: false, error: "guildId is required" });
      }

      const incoming = body.patch || body.config || {};
      const store = readStore();
      const current = deepMerge(DEFAULT_CONFIG, store[guildId] || {});
      const next = deepMerge(current, incoming);

      store[guildId] = next;
      writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || "moderator-config failed"
    });
  }
}
