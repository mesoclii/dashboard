"use client";

import { useEffect, useMemo, useState } from "react";

type GuildChannel = { id: string; name: string; type?: number | string };

type Field = {
  key: string;
  label: string;
  type: "text" | "voice" | "category" | "text-multi";
};

type Section = {
  key: string;
  label: string;
  source: "engine" | "setup";
  engine?: string;
  endpoint?: string;
  fields: Field[];
  supportsPanels?: boolean;
};

const SECTIONS: Section[] = [
  {
    key: "tickets",
    label: "Tickets",
    source: "setup",
    endpoint: "/api/setup/tickets-config",
    fields: [
      { key: "panelChannelId", label: "Panel Channel", type: "text" },
      { key: "ticketCategoryId", label: "Ticket Category", type: "category" },
      { key: "transcriptChannelId", label: "Transcript Channel", type: "text" },
      { key: "logChannelId", label: "Log Channel", type: "text" },
    ],
  },
  {
    key: "selfroles",
    label: "Selfroles",
    source: "setup",
    endpoint: "/api/setup/selfroles-config",
    fields: [{ key: "logChannelId", label: "Log Channel", type: "text" }],
    supportsPanels: true,
  },
  {
    key: "tts",
    label: "TTS",
    source: "engine",
    engine: "tts",
    fields: [
      { key: "allowedChannelIds", label: "Allowed Channels", type: "text-multi" },
      { key: "blockedChannelIds", label: "Blocked Channels", type: "text-multi" },
    ],
  },
  {
    key: "heist",
    label: "Heist",
    source: "engine",
    engine: "heist",
    fields: [
      { key: "signupChannelId", label: "Signup Channel", type: "text" },
      { key: "announceChannelId", label: "Announce Channel", type: "text" },
      { key: "transcriptChannelId", label: "Transcript Channel", type: "text" },
      { key: "voiceChannelId", label: "Voice Channel", type: "voice" },
    ],
  },
  {
    key: "giveaways",
    label: "Giveaways",
    source: "setup",
    endpoint: "/api/setup/giveaways-ui-config",
    fields: [{ key: "allowedChannelIds", label: "Allowed Channels", type: "text-multi" }],
  },
  {
    key: "music",
    label: "Music",
    source: "engine",
    engine: "music",
    fields: [{ key: "panelDeploy.channelId", label: "Panel Channel", type: "text" }],
  },
];

const card: React.CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.10)",
  marginBottom: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #6f0000",
  background: "#0a0a0a",
  color: "#ffd7d7",
};

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const q = new URLSearchParams(window.location.search).get("guildId") || "";
  const s = localStorage.getItem("activeGuildId") || "";
  const v = (q || s).trim();
  if (v) localStorage.setItem("activeGuildId", v);
  return v;
}

function readPath(input: any, path: string[]): any {
  let cur = input;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = cur[key];
  }
  return cur;
}

function writePath(input: any, path: string[], value: any) {
  const next = { ...(input || {}) };
  let cur: any = next;
  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    if (!cur[key] || typeof cur[key] !== "object") cur[key] = {};
    cur = cur[key];
  }
  cur[path[path.length - 1]] = value;
  return next;
}

function toggleId(list: string[], id: string) {
  const set = new Set(list || []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return Array.from(set);
}

export default function ChannelsClient() {
  const [guildId, setGuildId] = useState("");
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      setMsg("");
      try {
        const gd = await fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" })
          .then((r) => r.json());
        setChannels(Array.isArray(gd?.channels) ? gd.channels : []);

        const entries = await Promise.all(
          SECTIONS.map(async (section) => {
            const url = section.source === "engine"
              ? `/api/bot/engine-config?guildId=${encodeURIComponent(guildId)}&engine=${encodeURIComponent(section.engine || "")}`
              : `${section.endpoint}?guildId=${encodeURIComponent(guildId)}`;
            const res = await fetch(url, { cache: "no-store" });
            const json = await res.json().catch(() => ({}));
            return [section.key, json?.config || {}] as const;
          })
        );
        const next: Record<string, any> = {};
        for (const [key, config] of entries) next[key] = config;
        setConfigs(next);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load channel setup.");
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );
  const voiceChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 2 || Number(c?.type) === 13 || String(c?.type || "").toLowerCase().includes("voice")),
    [channels]
  );
  const categoryChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 4 || String(c?.type || "").toLowerCase().includes("category")),
    [channels]
  );

  function getOptions(field: Field) {
    if (field.type === "voice") return voiceChannels;
    if (field.type === "category") return categoryChannels;
    return textChannels;
  }

  async function saveSection(section: Section) {
    if (!guildId) return;
    setSaving((prev) => ({ ...prev, [section.key]: true }));
    setMsg("");
    try {
      const payload = section.source === "engine"
        ? { guildId, engine: section.engine, patch: configs[section.key] || {} }
        : { guildId, patch: configs[section.key] || {} };
      const res = await fetch(section.source === "engine" ? "/api/bot/engine-config" : section.endpoint!, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Save failed");
      setConfigs((prev) => ({ ...prev, [section.key]: json?.config || configs[section.key] }));
      setMsg(`${section.label} channels saved.`);
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving((prev) => ({ ...prev, [section.key]: false }));
    }
  }

  function updateField(sectionKey: string, field: Field, value: any) {
    setConfigs((prev) => {
      const current = prev[sectionKey] || {};
      const path = field.key.split(".");
      const next = writePath(current, path, value);
      return { ...prev, [sectionKey]: next };
    });
  }

  function updatePanelChannel(sectionKey: string, index: number, channelId: string) {
    setConfigs((prev) => {
      const current = { ...(prev[sectionKey] || {}) };
      const panels = Array.isArray(current.panels) ? [...current.panels] : [];
      if (!panels[index]) return prev;
      panels[index] = { ...panels[index], channelId };
      return { ...prev, [sectionKey]: { ...current, panels } };
    });
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;

  return (
    <div style={{ color: "#ffb3b3", padding: 14, maxWidth: 1300 }}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Channel Setup</h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== "undefined" ? (localStorage.getItem("activeGuildName") || guildId) : guildId}</p>
      {msg ? <div style={{ color: "#ffd27a", marginBottom: 12 }}>{msg}</div> : null}

      {SECTIONS.map((section) => {
        const cfg = configs[section.key] || {};
        return (
          <section key={section.key} style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div>
                <div style={{ color: "#ff6b6b", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.08em" }}>{section.label}</div>
                <div style={{ color: "#ffb7b7", fontSize: 12 }}>Set the channel routing for this engine.</div>
              </div>
              <button
                onClick={() => saveSection(section)}
                disabled={!!saving[section.key]}
                style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}
              >
                {saving[section.key] ? "Saving..." : "Save Channels"}
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>
              {section.fields.map((field) => {
                const value = readPath(cfg, field.key.split("."));
                if (field.type === "text-multi") {
                  const list = Array.isArray(value) ? value : [];
                  return (
                    <div key={field.key}>
                      <label>{field.label}</label>
                      <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #5a0000", borderRadius: 8, padding: 8 }}>
                        {textChannels.map((c) => (
                          <label key={`${field.key}-${c.id}`} style={{ display: "block", marginBottom: 4 }}>
                            <input
                              type="checkbox"
                              checked={list.includes(c.id)}
                              onChange={() => updateField(section.key, field, toggleId(list, c.id))}
                            />{" "}
                            #{c.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label>{field.label}</label>
                    <select
                      style={input}
                      value={value || ""}
                      onChange={(e) => updateField(section.key, field, e.target.value)}
                    >
                      <option value="">Select channel</option>
                      {getOptions(field).map((c) => (
                        <option key={c.id} value={c.id}>
                          {field.type === "voice" ? c.name : field.type === "category" ? c.name : `#${c.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {section.supportsPanels && Array.isArray(cfg.panels) ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>Panel Channels</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 8 }}>
                  {cfg.panels.map((panel: any, index: number) => (
                    <div key={`panel-${index}`}>
                      <label>{panel?.messageTitle || `Panel ${index + 1}`}</label>
                      <select
                        style={input}
                        value={panel?.channelId || ""}
                        onChange={(e) => updatePanelChannel(section.key, index, e.target.value)}
                      >
                        <option value="">Select channel</option>
                        {textChannels.map((c) => (
                          <option key={c.id} value={c.id}>
                            #{c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
