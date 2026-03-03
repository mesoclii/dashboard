"use client";



import { useEffect, useState } from "react";

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const g = (q || s).trim();
  if (g) localStorage.setItem("activeGuildId", g);
  return g;
}

export default function BackupsPage() {
  const [guildId, setGuildId] = useState("");
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [backupText, setBackupText] = useState("");
  const [msg, setMsg] = useState("");

  async function loadSnapshots() {
    const r = await fetch("/api/setup/snapshots");
    const j = await r.json();
    setSnapshots(Array.isArray(j?.snapshots) ? j.snapshots : []);
  }

  useEffect(() => {
    const g = getGuildId();
    setGuildId(g);
    loadSnapshots().catch(() => {});
  }, []);

  async function createSnapshot() {
    const r = await fetch("/api/setup/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, note: "manual-ui-snapshot" })
    });
    const j = await r.json();
    setMsg(j?.success ? "Snapshot created." : j?.error || "Snapshot failed.");
    await loadSnapshots();
  }

  async function exportConfig() {
    const r = await fetch(`/api/setup/config-backup?guildId=${guildId}`);
    const j = await r.json();
    if (!j?.success) {
      setMsg(j?.error || "Export failed.");
      return;
    }
    setBackupText(JSON.stringify(j.backup, null, 2));
    setMsg("Config exported.");
  }

  async function importConfig(mode: "merge" | "replace") {
    let payload: any;
    try {
      payload = JSON.parse(backupText || "{}");
    } catch {
      setMsg("Backup JSON is invalid.");
      return;
    }
    const r = await fetch("/api/setup/config-backup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, mode, payload })
    });
    const j = await r.json();
    setMsg(j?.success ? `Import complete (${mode}).` : j?.error || "Import failed.");
  }

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ marginTop: 0 }}>Backups + Restore</h1>
      <div style={{ color: "#ff9c9c", marginBottom: 10 }}>{msg}</div>

      <div style={{ marginBottom: 12, padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
        <button onClick={createSnapshot}>Create Snapshot</button>
        <button style={{ marginLeft: 8 }} onClick={loadSnapshots}>Refresh Snapshot List</button>
        <div style={{ marginTop: 8, maxHeight: 180, overflow: "auto", background: "#111", padding: 8 }}>
          {snapshots.map((s, i) => <div key={i}>{typeof s === "string" ? s : JSON.stringify(s)}</div>)}
          {snapshots.length === 0 && <div>No snapshots found.</div>}
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
        <button onClick={exportConfig}>Export Guild Config</button>
        <button style={{ marginLeft: 8 }} onClick={() => importConfig("merge")}>Import (Merge)</button>
        <button style={{ marginLeft: 8 }} onClick={() => importConfig("replace")}>Import (Replace)</button>
        <textarea
          value={backupText}
          onChange={(e) => setBackupText(e.target.value)}
          placeholder="Backup JSON shows here (or paste to import)"
          style={{ width: "100%", minHeight: 320, marginTop: 8, background: "#0c0c0c", color: "#ffd7d7" }}
        />
      </div>
    </div>
  );
}
