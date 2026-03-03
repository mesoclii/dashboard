"use client";



import { useEffect, useState } from "react";

function gid() {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  return (q || s).trim();
}

export default function RadioBirthdayPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<any>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const g = gid();
    setGuildId(g);
    if (!g) return;
    fetch(`/api/setup/radio-birthday-config?guildId=${g}`).then((r) => r.json()).then((j) => setCfg(j.config));
  }, []);

  async function save() {
    const r = await fetch("/api/setup/radio-birthday-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ guildId, patch: cfg })
    });
    const j = await r.json();
    setMsg(j?.success ? "Saved radio + birthday config." : j?.error || "Save failed.");
  }

  if (!cfg) return <div style={{ padding: 18 }}>Loading radio/birthday config...</div>;

  return (
    <div style={{ padding: 18 }}>
      <h1>Radio + Birthday</h1>
      <div>{msg}</div>

      <h3>Birthday</h3>
      <label><input type="checkbox" checked={!!cfg.birthday.enabled} onChange={(e) => setCfg((p: any) => ({ ...p, birthday: { ...p.birthday, enabled: e.target.checked } }))} /> Enabled</label>
      <div style={{ marginTop: 8 }}>
        <input value={cfg.birthday.rewardCoins} onChange={(e) => setCfg((p: any) => ({ ...p, birthday: { ...p.birthday, rewardCoins: Number(e.target.value || 0) } }))} placeholder="rewardCoins" />
      </div>

      <h3 style={{ marginTop: 12 }}>Radio</h3>
      <label><input type="checkbox" checked={!!cfg.radio.enabled} onChange={(e) => setCfg((p: any) => ({ ...p, radio: { ...p.radio, enabled: e.target.checked } }))} /> Enabled</label>
      <div style={{ marginTop: 8 }}>
        <input value={cfg.radio.volumeDefault} onChange={(e) => setCfg((p: any) => ({ ...p, radio: { ...p.radio, volumeDefault: Number(e.target.value || 0) } }))} placeholder="volumeDefault" />
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={save}>Save Radio + Birthday</button>
      </div>
    </div>
  );
}
