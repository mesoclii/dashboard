"use client";



import { useEffect, useMemo, useState } from "react";
import { getGuildId, loadDashboardConfig, saveDashboardPatch, styles, StatusPill } from "../_engineClient";

type GuildChannel = { id: string; name: string; type?: number | string };
type GuildRole = { id: string; name: string };

const DEFAULTS: any = {
  enabled: true,
  welcomeChannelId: "",
  mainChatChannelId: "",
  rulesChannelId: "",
  idChannelId: "",
  ticketCategoryId: "",
  transcriptChannelId: "",
  logChannelId: "",
  verifiedRoleId: "",
  declineRoleId: "",
  staffRoleIds: [],
  removeOnVerifyRoleIds: [],
  idTimeoutMinutes: 30,
  hostingLegacyChannelId: "",
  hostingEnhancedChannelId: "",
  staffIntroChannelId: "",
  selfRolesChannelId: "",
  botGuideChannelId: "",
  updatesChannelId: "",
  funChannelId: "",
  subscriptionChannelId: "",
  dmTemplate: "Welcome to {{guildName}}.\n\nStart onboarding in <#{{welcomeChannelId}}>.",
  panelTitle: "Welcome to {{guildName}}",
  panelDescription: "Read the rules in <#{{rulesChannelId}}> and confirm below to continue.",
  panelFooter: "Complete onboarding to unlock the server.",
  gateAnnouncementTemplate: "Survivor <@{{userId}}> has reached the gates.",
  idPanelTitle: "ID Verification - Final Gate",
  idPanelDescription: "<@{{userId}}> choose how you proceed.\n\nThose who refuse will be removed.",
  idPanelContent: "Survivor <@{{userId}}>",
  postVerifyTemplate: "<@{{userId}}> is now verified. Welcome to {{guildName}}.",
};

export default function OnboardingPage() {
  const [guildId, setGuildId] = useState("");
  const [cfg, setCfg] = useState<any>(DEFAULTS);
  const [orig, setOrig] = useState<any>(DEFAULTS);
  const [channels, setChannels] = useState<GuildChannel[]>([]);
  const [roles, setRoles] = useState<GuildRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => setGuildId(getGuildId()), []);

  useEffect(() => {
    if (!guildId) return;
    (async () => {
      setLoading(true);
      setMsg("");
      try {
        const [all, gd] = await Promise.all([
          loadDashboardConfig(guildId),
          fetch(`/api/bot/guild-data?guildId=${encodeURIComponent(guildId)}`, { cache: "no-store" }).then((res) => res.json()),
        ]);
        const next = { ...DEFAULTS, ...(all?.security?.onboarding || {}) };
        setCfg(next);
        setOrig(next);
        setChannels(Array.isArray(gd?.channels) ? gd.channels : []);
        setRoles(Array.isArray(gd?.roles) ? gd.roles : []);
      } catch (e: any) {
        setMsg(e?.message || "Failed to load onboarding settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, [guildId]);

  const dirty = useMemo(() => JSON.stringify(cfg) !== JSON.stringify(orig), [cfg, orig]);

  function toggleRole(list: string[], id: string) {
    const set = new Set(list || []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    return Array.from(set);
  }

  async function save() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      await saveDashboardPatch(guildId, { security: { onboarding: cfg } });
      setOrig(cfg);
      setMsg("Saved onboarding.");
    } catch (e: any) {
      setMsg(e?.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading onboarding...</div>;

  const textChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 0 || Number(c?.type) === 5 || String(c?.type || "").toLowerCase().includes("text")),
    [channels]
  );
  const categoryChannels = useMemo(
    () => channels.filter((c) => Number(c?.type) === 4 || String(c?.type || "").toLowerCase().includes("category")),
    [channels]
  );

  const channelFields: Array<{ key: keyof typeof DEFAULTS; label: string }> = [
    { key: "welcomeChannelId", label: "Welcome Channel" },
    { key: "mainChatChannelId", label: "Main Chat Channel" },
    { key: "rulesChannelId", label: "Rules Channel" },
    { key: "idChannelId", label: "ID Verification Channel" },
    { key: "transcriptChannelId", label: "Transcript Channel" },
    { key: "logChannelId", label: "Log Channel" },
    { key: "hostingLegacyChannelId", label: "Hosting Legacy Channel" },
    { key: "hostingEnhancedChannelId", label: "Hosting Enhanced Channel" },
    { key: "staffIntroChannelId", label: "Staff Intro Channel" },
    { key: "selfRolesChannelId", label: "Self Roles Channel" },
    { key: "botGuideChannelId", label: "Bot Guide Channel" },
    { key: "updatesChannelId", label: "Updates Channel" },
    { key: "funChannelId", label: "Fun Channel" },
    { key: "subscriptionChannelId", label: "Subscription Channel" },
  ];

  return (
    <div style={styles.page}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Onboarding
        <StatusPill on={!!cfg.enabled} />
      </h1>
      <p style={{ marginTop: 0 }}>Guild: {typeof window !== 'undefined' ? (localStorage.getItem('activeGuildName') || guildId) : guildId}</p>

      <div style={styles.card}>
        <label><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine enabled</label>
        <div style={{ marginTop: 10, maxWidth: 320 }}>
          <label>ID timeout minutes</label>
          <input style={styles.input} type="number" value={cfg.idTimeoutMinutes || 0} onChange={(e) => setCfg({ ...cfg, idTimeoutMinutes: Number(e.target.value || 0) })} />
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Channel and Role IDs</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {channelFields.map((field) => (
            <div key={field.key}>
              <label>{field.label}</label>
              <select
                style={styles.input}
                value={cfg[field.key] || ""}
                onChange={(e) => setCfg({ ...cfg, [field.key]: e.target.value })}
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
          <div>
            <label>Ticket Category</label>
            <select
              style={styles.input}
              value={cfg.ticketCategoryId || ""}
              onChange={(e) => setCfg({ ...cfg, ticketCategoryId: e.target.value })}
            >
              <option value="">Select category</option>
              {categoryChannels.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Verified Role</label>
            <select
              style={styles.input}
              value={cfg.verifiedRoleId || ""}
              onChange={(e) => setCfg({ ...cfg, verifiedRoleId: e.target.value })}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  @{r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Decline Role</label>
            <select
              style={styles.input}
              value={cfg.declineRoleId || ""}
              onChange={(e) => setCfg({ ...cfg, declineRoleId: e.target.value })}
            >
              <option value="">Select role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  @{r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label>Staff Roles (can operate onboarding)</label>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #5a0000", borderRadius: 8, padding: 8 }}>
              {roles.map((r) => (
                <label key={`staff_${r.id}`} style={{ display: "block", marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={(cfg.staffRoleIds || []).includes(r.id)}
                    onChange={() => setCfg({ ...cfg, staffRoleIds: toggleRole(cfg.staffRoleIds || [], r.id) })}
                  />{" "}
                  @{r.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label>Remove On Verify Roles</label>
            <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #5a0000", borderRadius: 8, padding: 8 }}>
              {roles.map((r) => (
                <label key={`remove_${r.id}`} style={{ display: "block", marginBottom: 4 }}>
                  <input
                    type="checkbox"
                    checked={(cfg.removeOnVerifyRoleIds || []).includes(r.id)}
                    onChange={() => setCfg({ ...cfg, removeOnVerifyRoleIds: toggleRole(cfg.removeOnVerifyRoleIds || [], r.id) })}
                  />{" "}
                  @{r.name}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ marginTop: 0, color: "#ff4444" }}>Templates</h3>
        {[
          "dmTemplate","panelTitle","panelDescription","panelFooter","gateAnnouncementTemplate",
          "idPanelTitle","idPanelDescription","idPanelContent","postVerifyTemplate"
        ].map((k) => (
          <div key={k} style={{ marginBottom: 10 }}>
            <label>{k}</label>
            {k.toLowerCase().includes("title") ? (
              <input style={styles.input} value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
            ) : (
              <textarea style={styles.area} value={cfg[k] || ""} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
            )}
          </div>
        ))}
      </div>

      {msg ? <p style={{ color: "#ff9a9a" }}>{msg}</p> : null}

      <div style={styles.saveDock}>
        <span style={{ color: dirty ? "#ffd27a" : "#9effb8", fontSize: 12 }}>{dirty ? "DIRTY" : "READY"}</span>
        <button onClick={save} disabled={saving || !dirty} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #7a0000", background: "#220000", color: "#ffd7d7" }}>
          {saving ? "Saving..." : "Save Onboarding"}
        </button>
      </div>
    </div>
  );
}
