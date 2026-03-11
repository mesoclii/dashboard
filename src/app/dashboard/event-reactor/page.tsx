"use client";

import { useEffect, useState } from "react";
import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

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

const box: React.CSSProperties = { border: "1px solid #5f0000", borderRadius: 12, padding: 14, background: "rgba(120,0,0,0.10)" };
const input: React.CSSProperties = { width: "100%", background: "#0a0a0a", color: "#ffd0d0", border: "1px solid #7f0000", borderRadius: 8, padding: "10px 12px" };

export default function EventReactorPage() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    channels,
    summary,
    details,
    loading,
    saving,
    message,
    save,
    runAction,
  } = useGuildEngineEditor<EventCfg>("eventReactor", EMPTY);

  const [routesJson, setRoutesJson] = useState("[]");

  useEffect(() => {
    setRoutesJson(JSON.stringify(cfg.customRoutes || [], null, 2));
  }, [cfg.customRoutes]);

  async function savePage() {
    let parsedRoutes = cfg.customRoutes || [];
    if (routesJson.trim()) {
      parsedRoutes = JSON.parse(routesJson);
    }
    await save({ ...cfg, customRoutes: parsedRoutes });
  }

  if (!guildId) return <div style={{ color: "#ff8080", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1200 }}>
      <h1 style={{ margin: 0, color: "#ff4444", letterSpacing: "0.12em", textTransform: "uppercase" }}>Event Reactor Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          <EngineInsights summary={summary} details={details} showDetails />

          <section style={box}>
            <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg((prev) => ({ ...prev, active: e.target.checked }))} /> Active</label>
            <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.listeners.messageCreate} onChange={(e) => setCfg((prev) => ({ ...prev, listeners: { ...prev.listeners, messageCreate: e.target.checked } }))} /> messageCreate</label>
              <label><input type="checkbox" checked={cfg.listeners.interactionCreate} onChange={(e) => setCfg((prev) => ({ ...prev, listeners: { ...prev.listeners, interactionCreate: e.target.checked } }))} /> interactionCreate</label>
              <label><input type="checkbox" checked={cfg.listeners.guildMemberAdd} onChange={(e) => setCfg((prev) => ({ ...prev, listeners: { ...prev.listeners, guildMemberAdd: e.target.checked } }))} /> guildMemberAdd</label>
              <label><input type="checkbox" checked={cfg.listeners.guildMemberRemove} onChange={(e) => setCfg((prev) => ({ ...prev, listeners: { ...prev.listeners, guildMemberRemove: e.target.checked } }))} /> guildMemberRemove</label>
              <label><input type="checkbox" checked={cfg.listeners.messageDelete} onChange={(e) => setCfg((prev) => ({ ...prev, listeners: { ...prev.listeners, messageDelete: e.target.checked } }))} /> messageDelete</label>
              <label><input type="checkbox" checked={cfg.listeners.messageUpdate} onChange={(e) => setCfg((prev) => ({ ...prev, listeners: { ...prev.listeners, messageUpdate: e.target.checked } }))} /> messageUpdate</label>
            </div>
            <div style={{ marginTop: 8, display: "flex", gap: 14, flexWrap: "wrap" }}>
              <label><input type="checkbox" checked={cfg.retries.enabled} onChange={(e) => setCfg((prev) => ({ ...prev, retries: { ...prev.retries, enabled: e.target.checked } }))} /> Retries Enabled</label>
              <label><input type="checkbox" checked={cfg.deadLetter.enabled} onChange={(e) => setCfg((prev) => ({ ...prev, deadLetter: { ...prev.deadLetter, enabled: e.target.checked } }))} /> Dead Letter Enabled</label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
              <div><div>Max Retries</div><input style={input} type="number" value={cfg.retries.maxRetries} onChange={(e) => setCfg((prev) => ({ ...prev, retries: { ...prev.retries, maxRetries: Number(e.target.value || 0) } }))} /></div>
              <div><div>Base Delay (ms)</div><input style={input} type="number" value={cfg.retries.baseDelayMs} onChange={(e) => setCfg((prev) => ({ ...prev, retries: { ...prev.retries, baseDelayMs: Number(e.target.value || 0) } }))} /></div>
              <div><div>Dead Letter Max Age (hours)</div><input style={input} type="number" value={cfg.deadLetter.maxAgeHours} onChange={(e) => setCfg((prev) => ({ ...prev, deadLetter: { ...prev.deadLetter, maxAgeHours: Number(e.target.value || 0) } }))} /></div>
              <div>
                <div>Dead Letter Channel</div>
                <select style={input} value={cfg.deadLetter.channelId || ""} onChange={(e) => setCfg((prev) => ({ ...prev, deadLetter: { ...prev.deadLetter, channelId: e.target.value } }))}>
                  <option value="">Select channel</option>
                  {(channels as Channel[]).filter((channel) => Number(channel?.type) === 0 || Number(channel?.type) === 5).map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ marginTop: 12 }}>
              <div>Operator Notes</div>
              <textarea style={{ ...input, minHeight: 80 }} value={cfg.notes || ""} onChange={(e) => setCfg((prev) => ({ ...prev, notes: e.target.value }))} />
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontWeight: 800 }}>Recovery Actions</div>
                <div style={{ color: "#ffbdbd", fontSize: 12 }}>Use the failure dashboard in System Health for cross-engine observability. This page keeps the engine-local recovery buttons.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => void runAction("clearFailures")} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>Clear Failures</button>
                <button onClick={() => void savePage()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
                  {saving ? "Saving..." : "Save Event Reactor"}
                </button>
              </div>
            </div>
          </section>

          <ConfigJsonEditor
            title="Advanced Event Reactor Config"
            value={cfg}
            disabled={saving}
            onApply={(next) => setCfg({ ...EMPTY, ...(next as EventCfg) })}
          />
        </div>
      )}
    </div>
  );
}
