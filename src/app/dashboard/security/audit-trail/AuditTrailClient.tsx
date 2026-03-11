"use client";

import { useCallback, useEffect, useState } from "react";

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const g = (q || s).trim();
  if (g) localStorage.setItem("activeGuildId", g);
  return g;
}

export default function AuditTrailPage() {
  const [guildId] = useState(() => getGuildId());
  const [cfg, setCfg] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [kind, setKind] = useState("dash-error");
  const [lines, setLines] = useState<string[]>([]);
  const [msg, setMsg] = useState("");

  const loadAll = useCallback(async (gid: string, k = kind) => {
    const [a, b, c] = await Promise.all([
      fetch(`/api/audit/config?guildId=${gid}`).then((r) => r.json()),
      fetch(`/api/audit/events?guildId=${gid}&limit=200`).then((r) => r.json()),
      fetch(`/api/audit/log-feed?kind=${encodeURIComponent(k)}&lines=200`).then((r) => r.json())
    ]);
    setCfg(a?.config || null);
    setEvents(Array.isArray(b?.events) ? b.events : []);
    setLines(Array.isArray(c?.lines) ? c.lines : []);
  }, [kind]);

  useEffect(() => {
    if (!guildId) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadAll(guildId);
      } catch {
        if (!cancelled) {
          setMsg("Failed to load audit data.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guildId, loadAll]);

  async function save() {
    const r = await fetch("/api/audit/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch: cfg })
    });
    const j = await r.json();
    setMsg(j?.success ? "Audit config saved." : j?.error || "Save failed.");
  }

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ marginTop: 0 }}>Audit Trail</h1>
      <div style={{ color: "#ff9c9c", marginBottom: 10 }}>{msg}</div>

      {cfg && (
        <div style={{ marginBottom: 12, padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
          <label><input type="checkbox" checked={!!cfg.active} onChange={(e) => setCfg((p: any) => ({ ...p, active: e.target.checked }))} /> Active</label>
          <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <input value={cfg.retainDays} onChange={(e) => setCfg((p: any) => ({ ...p, retainDays: Number(e.target.value || 0) }))} placeholder="retainDays" />
            <input value={cfg.exportChannelId || ""} onChange={(e) => setCfg((p: any) => ({ ...p, exportChannelId: e.target.value }))} placeholder="exportChannelId" />
          </div>
          <div style={{ marginTop: 8 }}>
            <button onClick={save}>Save Audit Config</button>
            <button style={{ marginLeft: 8 }} onClick={() => loadAll(guildId)}>Refresh</button>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 12, padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
        <h3 style={{ marginTop: 0 }}>Config Change History</h3>
        <div style={{ maxHeight: 260, overflow: "auto", fontSize: 12, background: "#111", padding: 8 }}>
          {events.map((e, i) => (
            <div key={i} style={{ marginBottom: 6 }}>
              [{e?.at}] {e?.area} {e?.action} {Array.isArray(e?.keys) ? `(${e.keys.join(", ")})` : ""}
            </div>
          ))}
          {events.length === 0 && <div>No events yet.</div>}
        </div>
      </div>

      <div style={{ padding: 12, border: "1px solid #5f0000", borderRadius: 10 }}>
        <h3 style={{ marginTop: 0 }}>Live PM2 Log Feed</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="dash-error">dash-error</option>
            <option value="dash-out">dash-out</option>
            <option value="bot-error">bot-error</option>
            <option value="bot-out">bot-out</option>
          </select>
          <button onClick={() => loadAll(guildId, kind)}>Refresh Log</button>
        </div>
        <pre style={{ maxHeight: 260, overflow: "auto", background: "#0b0b0b", color: "#ffc7c7", padding: 8, whiteSpace: "pre-wrap" }}>
{lines.join("\n")}
        </pre>
      </div>
    </div>
  );
}
