"use client";
import { useEffect, useMemo, useState } from "react";

type Role = { id: string; name: string };

function getGuildId() {
  const p = new URLSearchParams(window.location.search);
  const gid = String(p.get("guildId") || p.get("guildid") || localStorage.getItem("activeGuildId") || "").trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

export default function RolesClient() {
  const [guildId, setGuildId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const gid = getGuildId();
    setGuildId(gid);
    if (!gid) return;
    fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(gid)}`)
      .then(r => r.json())
      .then(j => setRoles(Array.isArray(j?.roles) ? j.roles : []))
      .catch(() => setRoles([]));
  }, []);

  const filtered = useMemo(() => {
    const x = q.trim().toLowerCase();
    return x ? roles.filter(r => (r.name || "").toLowerCase().includes(x)) : roles;
  }, [roles, q]);

  return (
    <div style={{ padding: 20, color: "#ff4444" }}>
      <h1 style={{ marginTop: 0 }}>Guild Roles</h1>
      <div style={{ marginBottom: 10 }}>Guild: {guildId || "missing"}</div>
      <div style={{ marginBottom: 10 }}>Total roles: {roles.length}</div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search role..."
        style={{ width: 320, padding: 10, background: "#111", border: "1px solid #5f0000", color: "#fff", borderRadius: 8, marginBottom: 12 }}
      />
      <div style={{ border: "1px solid #5f0000", borderRadius: 10, overflow: "hidden" }}>
        {filtered.map((r) => (
          <div key={r.id} style={{ padding: "10px 12px", borderBottom: "1px solid #2a0000", display: "flex", justifyContent: "space-between" }}>
            <div>{r.name}</div><div style={{ opacity: 0.8, fontSize: 12 }}>{r.id}</div>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 12, color: "#bbb" }}>No roles</div>}
      </div>
    </div>
  );
}
