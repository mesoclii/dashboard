import type { NextApiRequest, NextApiResponse } from "next";
import { appendAudit, deepMerge, readStore, writeStore } from "@/lib/setupStore";

const FILE = "radio-birthday-config.json";

function defaults() {
  return {
    active: true,
    birthday: {
      enabled: true,
      rewardCoins: 500,
      roleId: "",
      broadcastChannelId: "",
      timezone: "America/Los_Angeles",
      allowSelfSet: true
    },
    radio: {
      enabled: false,
      announceChannelId: "",
      djRoleIds: [],
      queueLimit: 50,
      allowLinks: true,
      volumeDefault: 60
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
      area: "radio-birthday",
      action: "save",
      keys: Object.keys(patch || {})
    });
    return res.status(200).json({ success: true, guildId: gid, config: next });
  }

  return res.status(405).json({ success: false, error: "Method not allowed" });
}
