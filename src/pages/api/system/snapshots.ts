import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

type SnapshotEntry = {
  name: string;
  createdAt: string;
  sourceGuildId: string;
  note?: string;
  config: Record<string, unknown>;
};

type SnapshotStore = {
  snapshots: Record<string, SnapshotEntry>;
};

type GuildBackup = {
  guildId: string;
  capturedAt: string;
  files: Record<string, unknown>;
};

const STORE_FILE = path.join(process.cwd(), "data", "dashboard-setup-snapshots.json");
const SETUP_DIR = path.join(process.cwd(), "data", "setup");

async function readStore(): Promise<SnapshotStore> {
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    if (!parsed || typeof parsed !== "object") return { snapshots: {} };
    if (!parsed.snapshots || typeof parsed.snapshots !== "object") parsed.snapshots = {};
    return parsed as SnapshotStore;
  } catch {
    return { snapshots: {} };
  }
}

async function writeStore(store: SnapshotStore) {
  await fs.mkdir(path.dirname(STORE_FILE), { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2), "utf8");
}

function cleanName(value: string) {
  return String(value || "")
    .trim()
    .replace(/[^\w\-.: ]+/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 100);
}

async function readJsonFile(filePath: string) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function isGuildId(value: string) {
  return /^\d{16,20}$/.test(String(value || "").trim());
}

async function buildGuildBackup(guildId: string): Promise<GuildBackup> {
  const files: Record<string, unknown> = {};

  try {
    const entries = await fs.readdir(SETUP_DIR);
    for (const fileName of entries) {
      if (!/^[a-zA-Z0-9._-]+\.json$/.test(fileName)) continue;
      const filePath = path.join(SETUP_DIR, fileName);
      const store = await readJsonFile(filePath);
      if (store && typeof store === "object" && guildId in store) {
        files[fileName] = (store as Record<string, unknown>)[guildId];
      }
    }
  } catch {
    return { guildId, capturedAt: new Date().toISOString(), files };
  }

  return {
    guildId,
    capturedAt: new Date().toISOString(),
    files,
  };
}

function snapshotMeta(snapshot: SnapshotEntry) {
  return {
    name: snapshot.name,
    createdAt: snapshot.createdAt,
    sourceGuildId: snapshot.sourceGuildId,
    note: snapshot.note || "",
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const store = await readStore();
      const name = String(req.query.name || "").trim();
      const full = String(req.query.full || "") === "1";

      if (name) {
        const item = store.snapshots[name];
        if (!item) return res.status(404).json({ success: false, error: "Snapshot not found" });
        return res.status(200).json({ success: true, snapshot: full ? item : snapshotMeta(item) });
      }

      const all = Object.values(store.snapshots).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
      return res.status(200).json({
        success: true,
        snapshots: full ? all : all.map(snapshotMeta),
      });
    }

    if (req.method === "POST") {
      const store = await readStore();

      const sourceGuildId = String(req.body?.sourceGuildId || req.body?.guildId || "").trim();
      if (!isGuildId(sourceGuildId)) {
        return res.status(400).json({ success: false, error: "guildId or sourceGuildId is required" });
      }

      const note = cleanName(String(req.body?.note || ""));
      const providedName = cleanName(String(req.body?.name || ""));
      const generatedName = cleanName(
        providedName || `${sourceGuildId}-${note || "snapshot"}-${new Date().toISOString().replace(/[:.]/g, "-")}`
      );
      const explicitConfig = req.body?.config && typeof req.body.config === "object" ? req.body.config : null;
      const derivedBackup = explicitConfig ? null : await buildGuildBackup(sourceGuildId);
      const config = explicitConfig || derivedBackup;

      if (!config || typeof config !== "object") {
        return res.status(400).json({ success: false, error: "config could not be captured for this snapshot" });
      }

      store.snapshots[generatedName] = {
        name: generatedName,
        createdAt: new Date().toISOString(),
        sourceGuildId,
        note: note || undefined,
        config: config as Record<string, unknown>,
      };
      await writeStore(store);

      return res.status(200).json({ success: true, snapshot: snapshotMeta(store.snapshots[generatedName]) });
    }

    if (req.method === "DELETE") {
      const name = String(req.query.name || "").trim();
      if (!name) return res.status(400).json({ success: false, error: "name is required" });

      const store = await readStore();
      if (!store.snapshots[name]) return res.status(404).json({ success: false, error: "Snapshot not found" });
      delete store.snapshots[name];
      await writeStore(store);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed" });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err?.message || "Internal error" });
  }
}
