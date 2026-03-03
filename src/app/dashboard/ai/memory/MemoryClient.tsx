"use client";



import { useEffect, useState } from "react";

function gid() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  return (q || s).trim();
}

export default function MemoryPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<any>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const g = gid();
    setGuildId(g);
    if (!g) return;
    fetch(`/api/setup/memory-context-config?guildId=${g}`).then((r) => r.json()).then((j) => setCfg(j.config));
  }, []);

  async function save() {
    const r = await fetch("/api/setup/memory-context-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch: cfg })
    });
    const j = await r.json();
    setMsg(j?.success ? "Saved memory config." : j?.error || "Save failed.");
  }

  if (!cfg) return <div style={{ padding: 18 }}>Loading memory config...</div>;

  return (
    <div style={{ padding: 18 }}>
      <h1>AI Memory + Context</h1>
      <div>{msg}</div>
      <label><input type="checkbox" checked={!!cfg.active} onChange={(e) => setCfg((p: any) => ({ ...p, active: e.target.checked }))} /> Active</label>
      <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <input value={cfg.shortTermMessages} onChange={(e) => setCfg((p: any) => ({ ...p, shortTermMessages: Number(e.target.value || 0) }))} />
        <input value={cfg.longTermMaxFacts} onChange={(e) => setCfg((p: any) => ({ ...p, longTermMaxFacts: Number(e.target.value || 0) }))} />
        <input value={cfg.perUserCap} onChange={(e) => setCfg((p: any) => ({ ...p, perUserCap: Number(e.target.value || 0) }))} />
      </div>
      <div style={{ marginTop: 10 }}>
        <label><input type="checkbox" checked={!!cfg.antiRepeat.enabled} onChange={(e) => setCfg((p: any) => ({ ...p, antiRepeat: { ...p.antiRepeat, enabled: e.target.checked } }))} /> Anti-repeat</label>
      </div>
      <div style={{ marginTop: 10 }}>
        <button onClick={save}>Save Memory Config</button>
      </div>
    </div>
  );
}
