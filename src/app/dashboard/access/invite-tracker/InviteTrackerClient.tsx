"use client";

import { useEffect, useMemo, useState } from "react";

type RewardTier = {
  invites: number;
  roleId: string;
  coins: number;
  label: string;
  prize: string;
  oneTime: boolean;
  stackable: boolean;
};

type Config = {
  active: boolean;
  publicEnabled: boolean;
  pointsName: string;
  rewardTiers: RewardTier[];
  announceChannelId: string;
  notes: string;
};

const DEFAULT_CONFIG: Config = {
  active: false,
  publicEnabled: false,
  pointsName: "Invites",
  rewardTiers: [
    { invites: 5, roleId: "", coins: 0, label: "", prize: "", oneTime: true, stackable: false },
    { invites: 10, roleId: "", coins: 250, label: "", prize: "", oneTime: true, stackable: false },
    { invites: 25, roleId: "", coins: 1000, label: "", prize: "", oneTime: true, stackable: false }
  ],
  announceChannelId: "",
  notes: ""
};

function resolveGuildId(): string {
  if (typeof window === "undefined") return "";
  const sp = new URLSearchParams(window.location.search);
  const q = sp.get("guildId") || sp.get("guildid") || "";
  const s = localStorage.getItem("activeGuildId") || localStorage.getItem("activeGuildid") || "";
  const g = (q || s).trim();
  if (g) {
    localStorage.setItem("activeGuildId", g);
    localStorage.setItem("activeGuildid", g);
  }
  return g;
}

export default function InviteTrackerClient() {
  const [guildId, setGuildId] = useState("");
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [original, setOriginal] = useState<Config>(DEFAULT_CONFIG);
  const [status, setStatus] = useState("Ready");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const g = resolveGuildId();
    setGuildId(g);
    if (!g) return;

    (async () => {
      try {
        const r = await fetch(`/api/setup/invite-tracker-config?guildId=${encodeURIComponent(g)}`, { cache: "no-store" });
        const j = await r.json();
        const merged: Config = {
          ...DEFAULT_CONFIG,
          ...(j?.config || {}),
          rewardTiers: Array.isArray(j?.config?.rewardTiers) ? j.config.rewardTiers : DEFAULT_CONFIG.rewardTiers
        };
        setConfig(merged);
        setOriginal(JSON.parse(JSON.stringify(merged)));
        setStatus("Loaded");
      } catch {
        setStatus("Load failed");
      }
    })();
  }, []);

  const dirty = useMemo(() => JSON.stringify(config) !== JSON.stringify(original), [config, original]);

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setStatus("Saving...");
    try {
      const r = await fetch("/api/setup/invite-tracker-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config })
      });
      const j = await r.json();
      if (!r.ok || j?.success === false) throw new Error();
      setOriginal(JSON.parse(JSON.stringify(config)));
      setStatus("Saved");
    } catch {
      setStatus("Save failed");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    setConfig(JSON.parse(JSON.stringify(original)));
    setStatus("Reverted");
  }

  if (!guildId) {
    return <main style={{ padding: 16, color: "#ff6666" }}>Missing guildId. Open from /guilds first.</main>;
  }

  return (
    <main style={{ padding: 16, color: "#ffd0d0" }}>
      <h1 style={{ marginTop: 0, color: "#ff4444", textTransform: "uppercase" }}>Invite Tracker</h1>
      <p style={{ color: "#ff8a8a" }}>Guild: {guildId}</p>

      <label style={{ display: "block", marginBottom: 8 }}>
        <input type="checkbox" checked={config.active} onChange={(e) => setConfig({ ...config, active: e.target.checked })} /> Active
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        <input type="checkbox" checked={config.publicEnabled} onChange={(e) => setConfig({ ...config, publicEnabled: e.target.checked })} /> Public leaderboard
      </label>

      <input
        style={{ width: "100%", marginBottom: 8 }}
        value={config.pointsName}
        onChange={(e) => setConfig({ ...config, pointsName: e.target.value })}
        placeholder="Points name"
      />

      <input
        style={{ width: "100%", marginBottom: 8 }}
        value={config.announceChannelId}
        onChange={(e) => setConfig({ ...config, announceChannelId: e.target.value })}
        placeholder="Announce channel ID"
      />

      <textarea
        style={{ width: "100%", minHeight: 100, marginBottom: 12 }}
        value={config.notes}
        onChange={(e) => setConfig({ ...config, notes: e.target.value })}
        placeholder="Notes"
      />

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={save} disabled={saving || !dirty}>{saving ? "Saving..." : "Save"}</button>
        <button onClick={cancel} disabled={saving || !dirty}>Cancel</button>
        <span style={{ color: "#ff9d9d" }}>{status}{dirty ? " • Unsaved changes" : ""}</span>
      </div>
    </main>
  );
}
