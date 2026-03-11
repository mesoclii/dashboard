"use client";



import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";

type Role = { id: string; name: string; position?: number };
type Channel = { id: string; name: string; type: number };

type GiveawayImage = {
  url: string;
  label: string;
};

type GiveawaysUiConfig = {
  active: boolean;
  defaultChannelId: string;
  channelId: string;
  ticketChannelId: string;
  defaultDurationMin: number;
  defaultWinners: number;
  defaultPrize: string;
  defaultImageUrl: string;
  announceTemplate: string;
  rerollTemplate: string;
  endTemplate: string;
  requireStaffApproval: boolean;
  allowedRoleIds: string[];
  blockedRoleIds: string[];
  hostRoleIds: string[];
  allowedChannelIds: string[];
  imageLibrary: GiveawayImage[];
  antiAbuse: {
    minAccountAgeDays: number;
    ignoreBotEntries: boolean;
  };
  runtime: {
    maxConcurrentGiveaways: number;
    cooldownMinutes: number;
  };
  notes: string;
  lastSavedAt: string;
};

const DEFAULT_CONFIG: GiveawaysUiConfig = {
  active: true,
  defaultChannelId: "",
  channelId: "",
  ticketChannelId: "",
  defaultDurationMin: 60,
  defaultWinners: 1,
  defaultPrize: "",
  defaultImageUrl: "",
  announceTemplate: "Giveaway started: {{prize}}",
  rerollTemplate: "Rerolled giveaway winner for {{prize}}",
  endTemplate: "Giveaway ended: {{prize}}",
  requireStaffApproval: false,
  allowedRoleIds: [],
  blockedRoleIds: [],
  hostRoleIds: [],
  allowedChannelIds: [],
  imageLibrary: [],
  antiAbuse: {
    minAccountAgeDays: 0,
    ignoreBotEntries: true
  },
  runtime: {
    maxConcurrentGiveaways: 5,
    cooldownMinutes: 0
  },
  notes: "",
  lastSavedAt: ""
};

function cloneDefaults(): GiveawaysUiConfig {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
}

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  const i = Math.trunc(n);
  if (i < min) return min;
  if (i > max) return max;
  return i;
}

function cleanText(v: unknown, fallback = "", max = 4000): string {
  return String(v ?? fallback).trim().slice(0, max);
}

function cleanId(v: unknown): string {
  const s = cleanText(v, "", 30);
  return /^\d{16,20}$/.test(s) ? s : "";
}

function cleanUrl(v: unknown): string {
  const s = cleanText(v, "", 2000);
  if (!s) return "";
  if (!/^https?:\/\//i.test(s)) return "";
  return s;
}

function uniqIds(ids: string[]): string[] {
  return [...new Set((ids || []).filter(Boolean))];
}

function normalize(cfg: GiveawaysUiConfig): GiveawaysUiConfig {
  const lib: GiveawayImage[] = [];
  const seen = new Set<string>();
  for (const row of cfg.imageLibrary || []) {
    const url = cleanUrl(row?.url);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    lib.push({ url, label: cleanText(row?.label, "", 120) });
    if (lib.length >= 80) break;
  }

  return {
    active: !!cfg.active,
    defaultChannelId: cleanId(cfg.defaultChannelId),
    channelId: cleanId(cfg.channelId),
    ticketChannelId: cleanId(cfg.ticketChannelId),
    defaultDurationMin: clampInt(cfg.defaultDurationMin, 60, 1, 43200),
    defaultWinners: clampInt(cfg.defaultWinners, 1, 1, 100),
    defaultPrize: cleanText(cfg.defaultPrize, "", 200),
    defaultImageUrl: cleanUrl(cfg.defaultImageUrl),
    announceTemplate: cleanText(cfg.announceTemplate, DEFAULT_CONFIG.announceTemplate, 4000),
    rerollTemplate: cleanText(cfg.rerollTemplate, DEFAULT_CONFIG.rerollTemplate, 4000),
    endTemplate: cleanText(cfg.endTemplate, DEFAULT_CONFIG.endTemplate, 4000),
    requireStaffApproval: !!cfg.requireStaffApproval,
    allowedRoleIds: uniqIds(cfg.allowedRoleIds || []),
    blockedRoleIds: uniqIds(cfg.blockedRoleIds || []),
    hostRoleIds: uniqIds(cfg.hostRoleIds || []),
    allowedChannelIds: uniqIds(cfg.allowedChannelIds || []),
    imageLibrary: lib,
    antiAbuse: {
      minAccountAgeDays: clampInt(cfg.antiAbuse?.minAccountAgeDays, 0, 0, 3650),
      ignoreBotEntries: !!cfg.antiAbuse?.ignoreBotEntries
    },
    runtime: {
      maxConcurrentGiveaways: clampInt(cfg.runtime?.maxConcurrentGiveaways, 5, 1, 100),
      cooldownMinutes: clampInt(cfg.runtime?.cooldownMinutes, 0, 0, 10080)
    },
    notes: cleanText(cfg.notes, "", 4000),
    lastSavedAt: cleanText(cfg.lastSavedAt, "", 64)
  };
}

function sig(cfg: GiveawaysUiConfig): string {
  return JSON.stringify(normalize(cfg));
}

function toLocal(ts: string): string {
  if (!ts) return "Never";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "Never";
  return d.toLocaleString();
}

function toggleId(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

type PickerItem = { id: string; name: string };

function IdPicker({
  label,
  items,
  selected,
  onChange,
  hash
}: {
  label: string;
  items: PickerItem[];
  selected: string[];
  onChange: (ids: string[]) => void;
  hash?: boolean;
}) {
  return (
    <details style={{ border: "1px solid #5f0000", borderRadius: 10, padding: 10, marginTop: 8 }}>
      <summary style={{ cursor: "pointer", color: "#ffd0d0" }}>
        {label} ({selected.length})
      </summary>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, maxHeight: 170, overflowY: "auto" }}>
        {items.map((r) => {
          const on = selected.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onChange(toggleId(selected, r.id))}
              style={{
                borderRadius: 999,
                border: on ? "1px solid #ff4a4a" : "1px solid #553030",
                padding: "6px 10px",
                background: on ? "rgba(255,0,0,0.20)" : "rgba(255,255,255,0.03)",
                color: on ? "#fff" : "#ffb7b7",
                cursor: "pointer",
                fontSize: 12
              }}
            >
              {hash ? "#" : ""}
              {r.name}
            </button>
          );
        })}
      </div>
    </details>
  );
}

export default function GiveawaysPage() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [cfg, setCfg] = useState<GiveawaysUiConfig>(cloneDefaults());
  const [initialSig, setInitialSig] = useState("");
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgLabel, setNewImgLabel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
    const fromStore = localStorage.getItem("activeGuildId") || "";
    const gid = (fromUrl || fromStore).trim();
    if (gid) {
      localStorage.setItem("activeGuildId", gid);
      setGuildId(gid);
    }
  }, []);

  useEffect(() => {
    if (!guildId) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setMsg("");

        const [gRes, cRes] = await Promise.all([
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`),
          fetch(`/api/setup/giveaways-ui-config?guildId=${encodeURIComponent(guildId)}`)
        ]);

        const g = await gRes.json();
        const c = await cRes.json();
        const loaded = normalize({ ...cloneDefaults(), ...(c?.config || {}) });

        setGuildName(g?.guild?.name || guildId);
        setRoles((Array.isArray(g?.roles) ? g.roles : []).sort((a: Role, b: Role) => Number(b.position || 0) - Number(a.position || 0)));
        setChannels(Array.isArray(g?.channels) ? g.channels : []);
        setCfg(loaded);
        setInitialSig(sig(loaded));
      } catch {
        setMsg("Failed to load giveaways config.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const textChannels = useMemo(() => channels.filter((c) => c.type === 0 || c.type === 5), [channels]);
  const dirty = useMemo(() => sig(cfg) !== initialSig, [cfg, initialSig]);

  async function silentPost(url: string, body: any): Promise<boolean> {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!r.ok) return false;
      const j = await r.json().catch(() => ({}));
      return j?.success !== false;
    } catch {
      return false;
    }
  }

  function applyPreset(name: "blank" | "starter" | "promo") {
    if (name === "blank") {
      setCfg((p) =>
        normalize({
          ...p,
          active: false,
          defaultChannelId: "",
          channelId: "",
          ticketChannelId: "",
          requireStaffApproval: false,
          allowedRoleIds: [],
          blockedRoleIds: [],
          hostRoleIds: [],
          allowedChannelIds: [],
          imageLibrary: [],
          defaultImageUrl: ""
        })
      );
      return;
    }

    if (name === "starter") {
      setCfg((p) =>
        normalize({
          ...p,
          active: true,
          defaultDurationMin: 60,
          defaultWinners: 1,
          requireStaffApproval: false,
          defaultChannelId: p.defaultChannelId,
          channelId: p.channelId,
          ticketChannelId: p.ticketChannelId,
          runtime: {
            ...p.runtime,
            maxConcurrentGiveaways: 5,
            cooldownMinutes: 0
          }
        })
      );
      return;
    }

    setCfg((p) =>
      normalize({
        ...p,
        active: true,
        defaultDurationMin: 180,
          defaultWinners: 3,
          requireStaffApproval: true,
          defaultChannelId: p.defaultChannelId,
          channelId: p.channelId,
          ticketChannelId: p.ticketChannelId,
          runtime: {
            ...p.runtime,
            maxConcurrentGiveaways: 10,
          cooldownMinutes: 15
        }
      })
    );
  }

  function addImage() {
    const url = cleanUrl(newImgUrl);
    if (!url) {
      setMsg("Image URL must start with http or https.");
      return;
    }
    if (cfg.imageLibrary.some((x) => x.url === url)) {
      setMsg("That image URL is already in the library.");
      return;
    }

    const next = normalize({
      ...cfg,
      imageLibrary: [...cfg.imageLibrary, { url, label: cleanText(newImgLabel, "", 120) }]
    });

    setCfg(next);
    if (!next.defaultImageUrl) {
      setCfg({ ...next, defaultImageUrl: url });
    }
    setNewImgUrl("");
    setNewImgLabel("");
    setMsg("");
  }

  function removeImage(url: string) {
    const next = normalize({
      ...cfg,
      imageLibrary: cfg.imageLibrary.filter((x) => x.url !== url),
      defaultImageUrl: cfg.defaultImageUrl === url ? "" : cfg.defaultImageUrl
    });
    setCfg(next);
  }

  async function saveAll() {
    if (!guildId) return;
    try {
      setSaving(true);
      setMsg("");

      const normalized = normalize(cfg);

      const res = await fetch("/api/setup/giveaways-ui-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, config: normalized })
      });
      const data = await res.json();
      if (!res.ok || data?.success === false) throw new Error(data?.error || "Save failed");

        const a = await silentPost("/api/bot/dashboard-config", {
          guildId,
          patch: {
            features: {
              giveawaysEnabled: !!normalized.active
            }
          }
        });

        setCfg(normalized);
        setInitialSig(sig(normalized));
        setMsg(`Saved giveaways config. Live sync ${Number(a)}/1.`);
      } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const card: React.CSSProperties = {
    border: "1px solid #5f0000",
    borderRadius: 12,
    padding: 14,
    background: "rgba(120,0,0,0.08)",
    marginBottom: 12
  };

  const input: React.CSSProperties = {
    width: "100%",
    background: "#0a0a0a",
    color: "#ffd0d0",
    border: "1px solid #7f0000",
    borderRadius: 8,
    padding: "10px 12px"
  };

  const pill = (on: boolean) => ({
    border: `1px solid ${on ? "#14a44d" : "#a41414"}`,
    borderRadius: 999,
    padding: "6px 12px",
    color: on ? "#7dff9c" : "#ff9a9a",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.06em"
  });

  if (!guildId) {
    return (
      <div style={{ color: "#ffb3b3", padding: 20 }}>
        Missing guildId. Open from <Link href="/guilds" style={{ color: "#fff" }}>/guilds</Link>.
      </div>
    );
  }

  return (
    <div style={{ color: "#ff5c5c", padding: 18, maxWidth: 1280 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>Giveaways Control</h1>
          <div style={{ color: "#ff9f9f", marginTop: 6 }}>Guild: {guildName || guildId}</div>
          <div style={{ color: "#ff9f9f", marginTop: 4 }}>Last saved: {toLocal(cfg.lastSavedAt)}</div>
        </div>
        <button
          onClick={saveAll}
          disabled={saving || loading}
          style={{ border: "1px solid #ff3636", background: "#190000", color: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}
        >
          {saving ? "Saving..." : "Save Giveaways"}
        </button>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <span style={pill(cfg.active)}>MODULE {cfg.active ? "ON" : "OFF"}</span>
        <span style={pill(cfg.requireStaffApproval)}>STAFF APPROVAL {cfg.requireStaffApproval ? "ON" : "OFF"}</span>
        <span style={pill(cfg.imageLibrary.length > 0)}>IMAGE LIBRARY {cfg.imageLibrary.length}</span>
        <span style={pill(!dirty)}>{dirty ? "UNSAVED" : "SAVED"}</span>
      </div>

      {msg ? <div style={{ marginTop: 10, color: "#ffd3d3" }}>{msg}</div> : null}

      {loading ? (
        <div style={{ marginTop: 16 }}>Loading...</div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Quick Presets</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => applyPreset("blank")} style={{ ...input, width: "auto", cursor: "pointer" }}>Blank</button>
              <button type="button" onClick={() => applyPreset("starter")} style={{ ...input, width: "auto", cursor: "pointer" }}>Starter</button>
              <button type="button" onClick={() => applyPreset("promo")} style={{ ...input, width: "auto", cursor: "pointer" }}>Promo</button>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Core</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <label><input type="checkbox" checked={cfg.active} onChange={(e) => setCfg({ ...cfg, active: e.target.checked })} /> Enabled</label>
              <label><input type="checkbox" checked={cfg.requireStaffApproval} onChange={(e) => setCfg({ ...cfg, requireStaffApproval: e.target.checked })} /> Staff approval required</label>
              <label><input type="checkbox" checked={cfg.antiAbuse.ignoreBotEntries} onChange={(e) => setCfg({ ...cfg, antiAbuse: { ...cfg.antiAbuse, ignoreBotEntries: e.target.checked } })} /> Ignore bot entries</label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <div>
                <div>Default Duration (minutes)</div>
                <input type="number" style={input} value={cfg.defaultDurationMin} onChange={(e) => setCfg({ ...cfg, defaultDurationMin: clampInt(e.target.value, 60, 1, 43200) })} />
              </div>
              <div>
                <div>Default Winners</div>
                <input type="number" style={input} value={cfg.defaultWinners} onChange={(e) => setCfg({ ...cfg, defaultWinners: clampInt(e.target.value, 1, 1, 100) })} />
              </div>
              <div>
                <div>Max Concurrent Giveaways</div>
                <input type="number" style={input} value={cfg.runtime.maxConcurrentGiveaways} onChange={(e) => setCfg({ ...cfg, runtime: { ...cfg.runtime, maxConcurrentGiveaways: clampInt(e.target.value, 5, 1, 100) } })} />
              </div>
              <div>
                <div>Cooldown (minutes)</div>
                <input type="number" style={input} value={cfg.runtime.cooldownMinutes} onChange={(e) => setCfg({ ...cfg, runtime: { ...cfg.runtime, cooldownMinutes: clampInt(e.target.value, 0, 0, 10080) } })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginTop: 10 }}>
              <div>
                <div>Default Prize</div>
                <input style={input} value={cfg.defaultPrize} onChange={(e) => setCfg({ ...cfg, defaultPrize: e.target.value })} placeholder="Example: Nitro 1 month" />
              </div>
              <div>
                <div>Min Account Age (days)</div>
                <input type="number" style={input} value={cfg.antiAbuse.minAccountAgeDays} onChange={(e) => setCfg({ ...cfg, antiAbuse: { ...cfg.antiAbuse, minAccountAgeDays: clampInt(e.target.value, 0, 0, 3650) } })} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>
              <div>
                <div>Default Giveaway Channel</div>
                <select style={input} value={cfg.defaultChannelId} onChange={(e) => setCfg({ ...cfg, defaultChannelId: e.target.value })}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div>Legacy Override Channel</div>
                <select style={input} value={cfg.channelId} onChange={(e) => setCfg({ ...cfg, channelId: e.target.value })}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <div>Ticket / Claim Channel</div>
                <select style={input} value={cfg.ticketChannelId} onChange={(e) => setCfg({ ...cfg, ticketChannelId: e.target.value })}>
                  <option value="">Select channel</option>
                  {textChannels.map((c) => (
                    <option key={c.id} value={c.id}>#{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Templates</h3>
            <div style={{ marginBottom: 10 }}>
              <div>Announce Template</div>
              <textarea style={{ ...input, minHeight: 80 }} value={cfg.announceTemplate} onChange={(e) => setCfg({ ...cfg, announceTemplate: e.target.value })} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <div>Reroll Template</div>
              <textarea style={{ ...input, minHeight: 80 }} value={cfg.rerollTemplate} onChange={(e) => setCfg({ ...cfg, rerollTemplate: e.target.value })} />
            </div>
            <div>
              <div>End Template</div>
              <textarea style={{ ...input, minHeight: 80 }} value={cfg.endTemplate} onChange={(e) => setCfg({ ...cfg, endTemplate: e.target.value })} />
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Access Control</h3>

            <IdPicker
              label="Allowed Roles (entry)"
              items={roles.map((r) => ({ id: r.id, name: r.name }))}
              selected={cfg.allowedRoleIds}
              onChange={(ids) => setCfg({ ...cfg, allowedRoleIds: ids })}
            />

            <IdPicker
              label="Blocked Roles (entry)"
              items={roles.map((r) => ({ id: r.id, name: r.name }))}
              selected={cfg.blockedRoleIds}
              onChange={(ids) => setCfg({ ...cfg, blockedRoleIds: ids })}
            />

            <IdPicker
              label="Host Roles (can start/reroll/end)"
              items={roles.map((r) => ({ id: r.id, name: r.name }))}
              selected={cfg.hostRoleIds}
              onChange={(ids) => setCfg({ ...cfg, hostRoleIds: ids })}
            />

            <IdPicker
              label="Allowed Channels"
              items={textChannels.map((c) => ({ id: c.id, name: c.name }))}
              selected={cfg.allowedChannelIds}
              onChange={(ids) => setCfg({ ...cfg, allowedChannelIds: ids })}
              hash
            />
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Image Library</h3>

            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr auto", gap: 10, alignItems: "center", marginBottom: 10 }}>
              <input style={input} value={newImgUrl} onChange={(e) => setNewImgUrl(e.target.value)} placeholder="https://example.com/image.png" />
              <input style={input} value={newImgLabel} onChange={(e) => setNewImgLabel(e.target.value)} placeholder="Label (optional)" />
              <button type="button" onClick={addImage} style={{ border: "1px solid #ff3b3b", background: "transparent", color: "#ffd0d0", borderRadius: 8, padding: "10px 12px", cursor: "pointer" }}>
                Add Image
              </button>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div>Default Image URL</div>
              <select style={input} value={cfg.defaultImageUrl} onChange={(e) => setCfg({ ...cfg, defaultImageUrl: e.target.value })}>
                <option value="">None</option>
                {cfg.imageLibrary.map((img) => (
                  <option key={img.url} value={img.url}>
                    {img.label ? `${img.label} - ${img.url}` : img.url}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
              {cfg.imageLibrary.length === 0 ? (
                <div style={{ color: "#ff9f9f" }}>No images yet.</div>
              ) : (
                cfg.imageLibrary.map((img) => (
                  <div key={img.url} style={{ border: "1px solid #5f0000", borderRadius: 8, padding: 10, display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center" }}>
                    <div style={{ color: "#ffd0d0", overflow: "hidden", textOverflow: "ellipsis" }}>
                      <div>{img.label || "Unlabeled image"}</div>
                      <div style={{ opacity: 0.8, fontSize: 12 }}>{img.url}</div>
                    </div>
                    <button type="button" onClick={() => removeImage(img.url)} style={{ border: "1px solid #ff3b3b", background: "transparent", color: "#ffd0d0", borderRadius: 8, padding: "8px 10px", cursor: "pointer" }}>
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={card}>
            <h3 style={{ marginTop: 0, color: "#ff4444" }}>Notes</h3>
            <textarea style={{ ...input, minHeight: 120 }} value={cfg.notes} onChange={(e) => setCfg({ ...cfg, notes: e.target.value })} />
          </div>

          <ConfigJsonEditor
            title="Advanced Giveaways Config"
            value={cfg}
            disabled={saving}
            onApply={async (next) => {
              const normalized = normalize({ ...cloneDefaults(), ...(next as any) });
              setCfg(normalized);
              await saveAll();
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <Link href={`/dashboard/economy?guildId=${encodeURIComponent(guildId)}`} style={{ color: "#fff" }}>
              Back to Economy
            </Link>
            <button
              onClick={saveAll}
              disabled={saving}
              style={{ border: "1px solid #ff3636", background: "#190000", color: "#fff", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}
            >
              {saving ? "Saving..." : "Save Giveaways"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
