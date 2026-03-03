import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type GovernanceConfig = {
  active: boolean;
  crew: {
    enabled: boolean;
    maxCrews: number;
    creationCost: number;
    maxCrewSize: number;
    allowPublicRecruitment: boolean;
    recruitChannelId: string;
    crewRolePrefix: string;
  };
  contracts: {
    enabled: boolean;
    dailyCap: number;
    weeklyCap: number;
    baseRewardCoins: number;
    xpReward: number;
    allowStacking: boolean;
    logChannelId: string;
  };
  dominion: {
    enabled: boolean;
    seasonsEnabled: boolean;
    seasonLengthDays: number;
    raidWindows: string[];
    basePayout: number;
    territoryDecayHours: number;
    announceChannelId: string;
  };
  treasury: {
    enabled: boolean;
    taxPercent: number;
    withdrawRoleIds: string[];
    minWithdrawAmount: number;
    maxWithdrawAmount: number;
    auditChannelId: string;
  };
  raidWarfare: {
    enabled: boolean;
    preparationMinutes: number;
    activeRaidMinutes: number;
    cooldownMinutes: number;
    defenderBonusPercent: number;
    attackerBonusPercent: number;
    warManagerRoleIds: string[];
    warLogChannelId: string;
  };
  notes: string;
};

const DATA_DIR = path.join(process.cwd(), "data", "ui");
const STORE_FILE = path.join(DATA_DIR, "governance-config.json");

const DEFAULT_CONFIG: GovernanceConfig = {
  active: true,
  crew: {
    enabled: true,
    maxCrews: 25,
    creationCost: 10000,
    maxCrewSize: 25,
    allowPublicRecruitment: true,
    recruitChannelId: "",
    crewRolePrefix: "Crew",
  },
  contracts: {
    enabled: true,
    dailyCap: 5,
    weeklyCap: 20,
    baseRewardCoins: 250,
    xpReward: 50,
    allowStacking: false,
    logChannelId: "",
  },
  dominion: {
    enabled: true,
    seasonsEnabled: false,
    seasonLengthDays: 30,
    raidWindows: ["Fri 20:00-22:00", "Sat 20:00-22:00"],
    basePayout: 500,
    territoryDecayHours: 48,
    announceChannelId: "",
  },
  treasury: {
    enabled: true,
    taxPercent: 5,
    withdrawRoleIds: [],
    minWithdrawAmount: 1000,
    maxWithdrawAmount: 100000,
    auditChannelId: "",
  },
  raidWarfare: {
    enabled: true,
    preparationMinutes: 15,
    activeRaidMinutes: 45,
    cooldownMinutes: 180,
    defenderBonusPercent: 10,
    attackerBonusPercent: 5,
    warManagerRoleIds: [],
    warLogChannelId: "",
  },
  notes: "",
};

function ensureStore() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(STORE_FILE)) fs.writeFileSync(STORE_FILE, JSON.stringify({}, null, 2), "utf8");
}

function readStore(): Record<string, GovernanceConfig> {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(STORE_FILE, "utf8") || "{}");
  } catch {
    return {};
  }
}

function writeStore(store: Record<string, GovernanceConfig>) {
  ensureStore();
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function mergeConfig(base: GovernanceConfig, patch: Partial<GovernanceConfig>): GovernanceConfig {
  return {
    ...base,
    ...patch,
    crew: { ...base.crew, ...(patch.crew || {}) },
    contracts: { ...base.contracts, ...(patch.contracts || {}) },
    dominion: {
      ...base.dominion,
      ...(patch.dominion || {}),
      raidWindows: Array.isArray(patch?.dominion?.raidWindows)
        ? patch!.dominion!.raidWindows.filter(Boolean)
        : base.dominion.raidWindows,
    },
    treasury: {
      ...base.treasury,
      ...(patch.treasury || {}),
      withdrawRoleIds: Array.isArray(patch?.treasury?.withdrawRoleIds)
        ? patch!.treasury!.withdrawRoleIds.filter(Boolean)
        : base.treasury.withdrawRoleIds,
    },
    raidWarfare: {
      ...base.raidWarfare,
      ...(patch.raidWarfare || {}),
      warManagerRoleIds: Array.isArray(patch?.raidWarfare?.warManagerRoleIds)
        ? patch!.raidWarfare!.warManagerRoleIds.filter(Boolean)
        : base.raidWarfare.warManagerRoleIds,
    },
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const guildId = String(req.query.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const store = readStore();
      const cfg = mergeConfig(DEFAULT_CONFIG, store[guildId] || {});
      return res.status(200).json({ success: true, guildId, config: cfg });
    }

    if (req.method === "POST") {
      const guildId = String(req.body?.guildId || "").trim();
      if (!guildId) return res.status(400).json({ success: false, error: "guildId is required" });

      const patch = (req.body?.patch || req.body?.config || {}) as Partial<GovernanceConfig>;
      const store = readStore();
      const current = mergeConfig(DEFAULT_CONFIG, store[guildId] || {});
      const next = mergeConfig(current, patch);

      store[guildId] = next;
      writeStore(store);

      return res.status(200).json({ success: true, guildId, config: next });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ success: false, error: e?.message || "Internal error" });
  }
}
