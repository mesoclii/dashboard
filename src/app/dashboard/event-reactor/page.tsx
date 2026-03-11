"use client";

import { useEffect, useState } from "react";
import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";

type EventCfg = {
  active: boolean;
  listeners: {
    messageCreate: boolean;
    interactionCreate: boolean;
    guildMemberAdd: boolean;
    guildMemberRemove: boolean;
    messageDelete: boolean;
    messageUpdate: boolean;
  };
  retries: { enabled: boolean; maxRetries: number; baseDelayMs: number };
  deadLetter: { enabled: boolean; maxAgeHours: number; channelId: string };
  customRoutes: any[];
  notes: string;
};

type Channel = { id: string; name: string; type?: number | string };

const EMPTY: EventCfg = {
  active: true,
  listeners: {
    messageCreate: true,
    interactionCreate: true,
    guildMemberAdd: true,
    guildMemberRemove: true,
    messageDelete: true,
    messageUpdate: true,
  },
  retries: { enabled: true, maxRetries: 2, baseDelayMs: 250 },
  deadLetter: { enabled: true, maxAgeHours: 24, channelId: "" },
  customRoutes: [],
  notes: "",
};

function getGuildId() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const id = (q || s).trim();
  if (id) localStorage.setItem("activeGuildId", id);
  return id;
}

const box: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)" };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

export default function EventReactorPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<EventCfg>(EMPTY);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [failures, setFailures] = useState<any[]>([]);
  const [routesJson, setRoutesJson] = useState("[]");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) { setLoading(false); return; }
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [cfgRes, gdRes] = await Promise.all([
          fetch(`/api/setup/event-routing-config?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }),
        ]);
        const c = await cfgRes.json().catch(() => ({}));
        const g = await gdRes.json().catch(() => ({}));
        const nextCfg = { ...EMPTY, ...(c?.config || {}) };
        setCfg(nextCfg);
        setRoutesJson(JSON.stringify(nextCfg.customRoutes || [], null, 2));
        setChannels((Array.isArray(g?.channels) ? g.channels : []).filter((x: any) => Number(x?.type) === 0));
      } catch (e: any) {
        setMsg(e?.message || "Failed to load Event Reactor config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  useEffect(() => {
    if (!guildId) return;
    loadFailures().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  async function loadFailures() {
    if (!guildId) return;
    const r = await fetch(`/api/bot/event-reactor-failures?guildId=${encodeURIComponent(guildId)}&limit=120`, { cache: "no-store" });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.success !== false) {
      setFailures(Array.isArray(j?.failures) ? j.failures : []);
    }
  }

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      let parsedRoutes = cfg.customRoutes || [];
      if (routesJson.trim()) {
        parsedRoutes = JSON.parse(routesJson);
      }
      const r = await fetch("/api/setup/event-routing-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: { ...cfg, customRoutes: parsedRoutes } }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j?.success === false) throw new Error(j?.error || "Save failed");
      const nextCfg = { ...EMPTY, ...(j?.config || cfg), customRoutes: parsedRoutes };
      setCfg(nextCfg);
      setRoutesJson(JSON.stringify(nextCfg.customRoutes || [], null, 2));
      setMsg("Event Reactor config saved.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed. Check JSON format.");
    } finally {
      setSaving(false);
    }
  }

  async function clearFailures() {
    if (!guildId) return;
    const r = await fetch("/api/bot/event-reactor-failures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, action: "clear" }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j?.success !== false) {
      setFailures([]);
      setMsg("Event reactor failures cleared.");
    } else {
      setMsg(j?.error || "Failed to clear failures.");
    }
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Event Reactor Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</div>
      {msg ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{msg}</div> : null}

      {loading ? <div>Loading...</div> : (
        <div style={{ display: "grid", gap: 12 }}>
          <section style={box}>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((p) => ({ ...p, active: e.target.checked }))} /> Active</label>
            <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.listeners.messageCreate} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, messageCreate: e.target.checked } }))} /> messageCreate</label>
              <label><input type="checkbox" checked={cfg.listeners.interactionCreate} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, interactionCreate: e.target.checked } }))} /> interactionCreate</label>
              <label><input type="checkbox" checked={cfg.listeners.guildMemberAdd} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, guildMemberAdd: e.target.checked } }))} /> guildMemberAdd</label>
              <label><input type="checkbox" checked={cfg.listeners.guildMemberRemove} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, guildMemberRemove: e.target.checked } }))} /> guildMemberRemove</label>
              <label><input type="checkbox" checked={cfg.listeners.messageDelete} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, messageDelete: e.target.checked } }))} /> messageDelete</label>
              <label><input type="checkbox" checked={cfg.listeners.messageUpdate} onChange={(e) => setCfg((p) => ({ ...p, listeners: { ...p.listeners, messageUpdate: e.target.checked } }))} /> messageUpdate</label>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.retries.enabled} onChange={(e) => setCfg((p) => ({ ...p, retries: { ...p.retries, enabled: e.target.checked } }))} /> Retries Enabled</label>
              <label><input type="checkbox" checked={cfg.deadLetter.enabled} onChange={(e) => setCfg((p) => ({ ...p, deadLetter: { ...p.deadLetter, enabled: e.target.checked } }))} /> Dead Letter Enabled</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div><div>Max Retries</div><input style={input} type="number" value={cfg.retries.maxRetries} onChange={(e) => setCfg((p) => ({ ...p, retries: { ...p.retries, maxRetries: Number(e.target.value || 0) } }))} /></div>
              <div><div>Base Delay (ms)</div><input style={input} type="number" value={cfg.retries.baseDelayMs} onChange={(e) => setCfg((p) => ({ ...p, retries: { ...p.retries, baseDelayMs: Number(e.target.value || 0) } }))} /></div>
              <div><div>Dead Letter Max Age (hours)</div><input style={input} type="number" value={cfg.deadLetter.maxAgeHours} onChange={(e) => setCfg((p) => ({ ...p, deadLetter: { ...p.deadLetter, maxAgeHours: Number(e.target.value || 0) } }))} /></div>
              <div><div>Dead Letter Channel</div><select style={input} value={cfg.deadLetter.channelId || ""} onChange={(e) => setCfg((p) => ({ ...p, deadLetter: { ...p.deadLetter, channelId: e.target.value } }))}><option value="">Select channel</option>{channels.map((c) => <option key={c.id} value={c.id}>#{c.name}</option>)}</select></div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div>Operator Notes</div>
              <textarea style={{ ...input, minHeight: 80 }} value={cfg.notes || ""} onChange={(e) => setCfg((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </section>

          <section style={box}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>Custom Routes (JSON)</div>
            <div style={{ color: "#ffbdbd", fontSize: 12, marginBottom: 8 }}>
              Each route should include <code>event</code>, <code>channelId</code>, and optional <code>message</code>, <code>embedTitle</code>, <code>embedDescription</code>.
            </div>
            <textarea style={{ ...input, minHeight: 180 }} value={routesJson} onChange={(e) => setRoutesJson(e.target.value)} />
          </section>

          <section style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800 }}>Failure Inbox</div>
                <div style={{ color: "#ffbdbd", fontSize: 12 }}>Recent runtime failures captured by the event reactor.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => void loadFailures()} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>Refresh</button>
                <button onClick={() => void clearFailures()} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>Clear</button>
              </div>
            </div>
            <div style={{ marginTop: 10, maxHeight: 240, overflow: "auto", background: "#0b0b0b", padding: 10, borderRadius: 8 }}>
              {failures.length ? failures.map((item, idx) => (
                <div key={`${item.id || idx}`} style={{ marginBottom: 10 }}>
                  <div><b>{item.event}</b> {item.createdAt ? `• ${item.createdAt}` : ""}</div>
                  <div style={{ fontSize: 12, color: "#ffbdbd" }}>{String(item.error || "Unknown").slice(0, 160)}</div>
                </div>
              )) : <div style={{ color: "#ffbdbd", fontSize: 12 }}>No failures recorded.</div>}
            </div>
          </section>

          <ConfigJsonEditor
            title="Advanced Event Reactor Config"
            value={cfg}
            disabled={saving}
            onApply={async (next) => {
              const merged = { ...EMPTY, ...(next as any) };
              setCfg(merged);
              await save();
            }}
          />

          <button onClick={save} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
            {saving ? "Saving..." : "Save Event Reactor"}
          </button>
        </div>
      )}
    </div>
  );
}
