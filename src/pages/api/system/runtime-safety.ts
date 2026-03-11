import type { NextApiRequest, NextApiResponse } from "next";
import { appendAudit, deepMerge, readStore, writeStore } from "@/lib/setupStore";

const FILE = "runtime-safety.json";

function defaults() {
  return {
    active: true,
    crashGuard: {
      enabled: true,
      maxRestartsPerHour: 6,
      cooldownSeconds: 60,
      autoPauseOnLoop: true,
      notifyChannelId: ""
    },
    cooldowns: {
      globalDefaultSeconds: 3,
      perCommand: {},
      perEngine: {}
    },
    rateLimits: {
      messagePer10s: 8,
      commandPerMinute: 15,
      aiPerMinute: 6,
      ttsPerMinute: 3,
      blockMinutes: 10
    },
    emergency: {
      globalReadOnly: false,
      disableAi: false,
      disableTts: false,
      disableGames: false,
      disableAutomation: false,
      blocklistUserIds: [],
      blocklistRoleIds: [],
      blocklistChannelIds: []
    }
  };
}

function guildId(req: NextApiRequest) {
  return String(req.query.guildId || req.body?.guildId || "").trim();
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const gid = guildId(req);
  if (!gid) return res.status(400).json({ success: false, error: "guildId required" });

  const store = readStore(FILE);
  const current = store[gid] || defaults();

  if (req.method === "GET") {
    return res.status(200).json({ success: true, guildId: gid, config: current });
  }

  if (req.method === "POST") {
    const patch = req.body?.patch || {};
    const next = deepMerge(current, patch);
    store[gid] = next;
    writeStore(FILE, store);
    appendAudit({
      guildId: gid,
      area: "runtime-safety",
      action: "save",
      keys: Object.keys(patch || {})
    });
    return res.status(200).json({ success: true, guildId: gid, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
