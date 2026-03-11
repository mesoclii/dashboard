"use client";

import ConfigJsonEditor from "@/components/possum/ConfigJsonEditor";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";

type VerificationConfig = {
  enabled: boolean;
  autoKickOnDecline: boolean;
  autoKickOnTimeout: boolean;
  declineAction?: "kick" | "ban" | "none";
  declineKickReason: string;
  timeoutKickReason: string;
  declineReplyTemplate: string;
};

const DEFAULTS: VerificationConfig = {
  enabled: true,
  autoKickOnDecline: true,
  autoKickOnTimeout: true,
  declineAction: "kick",
  declineKickReason: "Declined ID verification",
  timeoutKickReason: "ID submission timeout",
  declineReplyTemplate: "You declined ID verification.",
};

const styles = {
  page: { color: "#ffb3b3", padding: 14, maxWidth: 1200 },
  card: {
    border: "1px solid #5f0000",
    borderRadius: 12,
    padding: 14,
    background: "rgba(120,0,0,0.10)",
    marginBottom: 12,
  },
  input: {
    width: "100%",
    padding: 10,
    borderRadius: 8,
    border: "1px solid #6f0000",
    background: "#0a0a0a",
    color: "#ffd7d7",
  },
  area: {
    width: "100%",
    minHeight: 92,
    padding: 10,
    borderRadius: 8,
    border: "1px solid #6f0000",
    background: "#0a0a0a",
    color: "#ffd7d7",
  },
};

export default function VerificationPage() {
  const {
    guildId,
    guildName,
    config: cfg,
    setConfig: setCfg,
    summary,
    details,
    loading,
    saving,
    message,
    save,
  } = useGuildEngineEditor<VerificationConfig>("verification", DEFAULTS);

  if (!guildId) return <div style={{ color: "#ff8a8a", padding: 20 }}>Missing guildId. Open from /guilds.</div>;
  if (loading) return <div style={{ color: "#ff8a8a", padding: 20 }}>Loading verification...</div>;

  return (
    <div style={styles.page}>
      <h1 style={{ marginTop: 0, color: "#ff3b3b", letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Verification
      </h1>
      <p style={{ marginTop: 0 }}>Guild: {guildName || guildId}</p>
      {message ? <div style={{ color: "#ffd27a", marginBottom: 8 }}>{message}</div> : null}

      <EngineInsights summary={summary} details={details} />

      <div style={styles.card}>
        <label><input type="checkbox" checked={!!cfg.enabled} onChange={(e) => setCfg({ ...cfg, enabled: e.target.checked })} /> Engine enabled</label><br />
        <label><input type="checkbox" checked={!!cfg.autoKickOnDecline} onChange={(e) => setCfg({ ...cfg, autoKickOnDecline: e.target.checked })} /> Auto-kick on decline</label><br />
        <label><input type="checkbox" checked={!!cfg.autoKickOnTimeout} onChange={(e) => setCfg({ ...cfg, autoKickOnTimeout: e.target.checked })} /> Auto-kick on timeout</label>
        <div style={{ marginTop: 10, maxWidth: 260 }}>
          <label>Decline action</label>
          <select style={styles.input} value={cfg.declineAction || "kick"} onChange={(e) => setCfg({ ...cfg, declineAction: e.target.value as VerificationConfig["declineAction"] })}>
            <option value="kick">kick</option>
            <option value="ban">ban</option>
            <option value="none">none</option>
          </select>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ marginBottom: 10 }}>
          <label>Decline kick reason</label>
          <input style={styles.input} value={cfg.declineKickReason || ""} onChange={(e) => setCfg({ ...cfg, declineKickReason: e.target.value })} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Timeout kick reason</label>
          <input style={styles.input} value={cfg.timeoutKickReason || ""} onChange={(e) => setCfg({ ...cfg, timeoutKickReason: e.target.value })} />
        </div>
        <div>
          <label>Decline reply template</label>
          <textarea style={styles.area} value={cfg.declineReplyTemplate || ""} onChange={(e) => setCfg({ ...cfg, declineReplyTemplate: e.target.value })} />
        </div>
      </div>

      <ConfigJsonEditor
        title="Advanced Verification Config"
        value={cfg}
        disabled={saving}
        onApply={(next) => setCfg({ ...DEFAULTS, ...(next as VerificationConfig) })}
      />

      <button onClick={() => void save()} disabled={saving} style={{ ...styles.input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
        {saving ? "Saving..." : "Save Verification"}
      </button>
    </div>
  );
}
