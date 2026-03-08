"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import EngineContractPanel from "@/components/possum/EngineContractPanel";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";
import { buildDashboardHref } from "@/lib/dashboardContext";

type SecurityConfig = {
  enabled: boolean;
  active: boolean;
  mode: string;
  policyPreset: string;
  approvalRequired: boolean;
  autoEscalate: boolean;
  autoEnforce: boolean;
  sensitivity: number;
  thresholdLow: number;
  thresholdHigh: number;
  decayMinutes: number;
  cooldownSeconds: number;
  historyHours: number;
  actionLimitPerMinute: number;
  slowmodeSeconds: number;
  durationMinutes: number;
  quorumRequired: number;
  minAccountAgeDays: number;
  trustFloor: number;
  escalationThreshold: number;
  alertChannelId: string;
  logChannelId: string;
  reviewChannelId: string;
  controlChannelId: string;
  panelChannelId: string;
  primaryChannelId: string;
  secondaryChannelId: string;
  announceChannelId: string;
  transcriptChannelId: string;
  monitoredChannelIds: string[];
  monitoredCategoryIds: string[];
  targetCategoryIds: string[];
  staffRoleIds: string[];
  trustedRoleIds: string[];
  notifyRoleIds: string[];
  exemptRoleIds: string[];
  allowRoleIds: string[];
  allowlist: string[];
  blocklist: string[];
  weights: {
    integrity: number;
    links: number;
    drift: number;
    threat: number;
    trust: number;
  };
  notes: string;
};

type RelatedLink = {
  label: string;
  route: string;
  reason: string;
};

const DEFAULT_CONFIG: SecurityConfig = {
  enabled: true,
  active: true,
  mode: "monitor",
  policyPreset: "balanced",
  approvalRequired: true,
  autoEscalate: true,
  autoEnforce: false,
  sensitivity: 5,
  thresholdLow: 25,
  thresholdHigh: 60,
  decayMinutes: 60,
  cooldownSeconds: 30,
  historyHours: 24,
  actionLimitPerMinute: 10,
  slowmodeSeconds: 30,
  durationMinutes: 30,
  quorumRequired: 1,
  minAccountAgeDays: 0,
  trustFloor: 0,
  escalationThreshold: 0,
  alertChannelId: "",
  logChannelId: "",
  reviewChannelId: "",
  controlChannelId: "",
  panelChannelId: "",
  primaryChannelId: "",
  secondaryChannelId: "",
  announceChannelId: "",
  transcriptChannelId: "",
  monitoredChannelIds: [],
  monitoredCategoryIds: [],
  targetCategoryIds: [],
  staffRoleIds: [],
  trustedRoleIds: [],
  notifyRoleIds: [],
  exemptRoleIds: [],
  allowRoleIds: [],
  allowlist: [],
  blocklist: [],
  weights: {
    integrity: 1,
    links: 1,
    drift: 1,
    threat: 1,
    trust: 1,
  },
  notes: "",
};

const shell: CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1420 };
const box: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.10)",
  marginBottom: 12,
};
const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "10px 12px",
};
const label: CSSProperties = {
  color: "#ffb0b0",
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
};

function toggle(list: string[], id: string) {
  const next = new Set(list || []);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return Array.from(next);
}

function lines(value: string) {
  return value
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function SecuritySubEngineConsole({
  engineKey,
  title,
  intro,
  related = [],
}: {
  engineKey: string;
  title: string;
  intro: string;
  related?: RelatedLink[];
}) {
  const {
    guildId,
    guildName,
    config,
    setConfig,
    channels,
    roles,
    summary,
    details,
    loading,
    saving,
    message,
    save,
  } = useGuildEngineEditor<SecurityConfig>(engineKey, DEFAULT_CONFIG);

  const categoryChannels = channels.filter((channel) => Number(channel?.type) === 4);
  const textChannels = channels.filter((channel) => Number(channel?.type) === 0 || Number(channel?.type) === 5);

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={shell}>
      <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Security Sub-Engine</div>
      <h1 style={{ margin: "8px 0 0", color: "#ff4444", letterSpacing: "0.10em", textTransform: "uppercase" }}>{title}</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffb8b8", lineHeight: 1.7, maxWidth: 1100, marginBottom: 12 }}>{intro}</div>

      <EngineContractPanel engineKey={engineKey} intro={intro} related={related} />
      {message ? <div style={{ marginBottom: 10, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div style={box}>Loading security engine...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked, active: e.target.checked }))} />
                Engine Enabled
              </label>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={config.approvalRequired} onChange={(e) => setConfig((prev) => ({ ...prev, approvalRequired: e.target.checked }))} />
                Approval Required
              </label>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={config.autoEscalate} onChange={(e) => setConfig((prev) => ({ ...prev, autoEscalate: e.target.checked }))} />
                Auto Escalate
              </label>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={config.autoEnforce} onChange={(e) => setConfig((prev) => ({ ...prev, autoEnforce: e.target.checked }))} />
                Auto Enforce
              </label>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14, marginTop: 14 }}>
              <div>
                <div style={label}>Mode</div>
                <input style={input} value={config.mode} onChange={(e) => setConfig((prev) => ({ ...prev, mode: e.target.value }))} />
              </div>
              <div>
                <div style={label}>Policy Preset</div>
                <input style={input} value={config.policyPreset} onChange={(e) => setConfig((prev) => ({ ...prev, policyPreset: e.target.value }))} />
              </div>
              {[
                ["sensitivity", "Sensitivity", 1, 10],
                ["thresholdLow", "Low Threshold", 0, 1000],
                ["thresholdHigh", "High Threshold", 0, 1000],
                ["decayMinutes", "Decay Minutes", 0, 10080],
                ["cooldownSeconds", "Cooldown Seconds", 0, 3600],
                ["historyHours", "History Window", 1, 720],
                ["actionLimitPerMinute", "Action Limit / Min", 0, 1000],
                ["slowmodeSeconds", "Slowmode Seconds", 0, 21600],
                ["durationMinutes", "Duration Minutes", 0, 10080],
                ["quorumRequired", "Approval Quorum", 0, 20],
                ["minAccountAgeDays", "Min Account Age", 0, 3650],
                ["trustFloor", "Trust Floor", 0, 100],
                ["escalationThreshold", "Escalation Threshold", 0, 1000],
              ].map(([key, text, min, max]) => (
                <div key={key}>
                  <div style={label}>{text}</div>
                  <input
                    style={input}
                    type="number"
                    min={min}
                    max={max}
                    value={Number(config[key as keyof SecurityConfig] || 0)}
                    onChange={(e) => setConfig((prev) => ({ ...prev, [key]: Number(e.target.value || min) }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <section style={box}>
            <div style={{ color: "#ffb3b3", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>Channel Routing</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 14 }}>
              {[
                ["alertChannelId", "Alert Channel"],
                ["logChannelId", "Log Channel"],
                ["reviewChannelId", "Review Channel"],
                ["controlChannelId", "Control Channel"],
                ["panelChannelId", "Panel Channel"],
                ["primaryChannelId", "Primary Channel"],
                ["secondaryChannelId", "Secondary Channel"],
                ["announceChannelId", "Announce Channel"],
                ["transcriptChannelId", "Transcript Channel"],
              ].map(([key, text]) => (
                <div key={key}>
                  <div style={label}>{text}</div>
                  <select style={input} value={String(config[key as keyof SecurityConfig] || "")} onChange={(e) => setConfig((prev) => ({ ...prev, [key]: e.target.value }))}>
                    <option value="">Not set</option>
                    {textChannels.map((channel) => (
                      <option key={channel.id} value={channel.id}>#{channel.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </section>

          <section style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
              <div>
                <div style={label}>Monitored Channels</div>
                <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 10, padding: 10 }}>
                  {textChannels.map((channel) => (
                    <label key={channel.id} style={{ display: "block", marginBottom: 6, color: "#ffdcdc" }}>
                      <input type="checkbox" checked={config.monitoredChannelIds.includes(channel.id)} onChange={() => setConfig((prev) => ({ ...prev, monitoredChannelIds: toggle(prev.monitoredChannelIds, channel.id) }))} /> #{channel.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={label}>Monitored Categories</div>
                <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 10, padding: 10 }}>
                  {categoryChannels.map((channel) => (
                    <label key={channel.id} style={{ display: "block", marginBottom: 6, color: "#ffdcdc" }}>
                      <input type="checkbox" checked={config.monitoredCategoryIds.includes(channel.id)} onChange={() => setConfig((prev) => ({ ...prev, monitoredCategoryIds: toggle(prev.monitoredCategoryIds, channel.id) }))} /> {channel.name}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <div style={label}>Target Categories</div>
                <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 10, padding: 10 }}>
                  {categoryChannels.map((channel) => (
                    <label key={channel.id} style={{ display: "block", marginBottom: 6, color: "#ffdcdc" }}>
                      <input type="checkbox" checked={config.targetCategoryIds.includes(channel.id)} onChange={() => setConfig((prev) => ({ ...prev, targetCategoryIds: toggle(prev.targetCategoryIds, channel.id) }))} /> {channel.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 14 }}>
              {[
                ["staffRoleIds", "Staff Roles"],
                ["trustedRoleIds", "Trusted Roles"],
                ["notifyRoleIds", "Notify Roles"],
                ["exemptRoleIds", "Exempt Roles"],
                ["allowRoleIds", "Allow Roles"],
              ].map(([key, text]) => (
                <div key={key}>
                  <div style={label}>{text}</div>
                  <div style={{ maxHeight: 220, overflowY: "auto", border: "1px solid #500000", borderRadius: 10, padding: 10 }}>
                    {roles.map((role) => (
                      <label key={role.id} style={{ display: "block", marginBottom: 6, color: "#ffdcdc" }}>
                        <input type="checkbox" checked={Array.isArray(config[key as keyof SecurityConfig]) && (config[key as keyof SecurityConfig] as string[]).includes(role.id)} onChange={() => setConfig((prev) => ({ ...prev, [key]: toggle(prev[key as keyof SecurityConfig] as string[], role.id) }))} /> @{role.name}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 14 }}>
              <div>
                <div style={label}>Allowlist Entries</div>
                <textarea style={{ ...input, minHeight: 100 }} value={config.allowlist.join("\n")} onChange={(e) => setConfig((prev) => ({ ...prev, allowlist: lines(e.target.value) }))} />
              </div>
              <div>
                <div style={label}>Blocklist Entries</div>
                <textarea style={{ ...input, minHeight: 100 }} value={config.blocklist.join("\n")} onChange={(e) => setConfig((prev) => ({ ...prev, blocklist: lines(e.target.value) }))} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginTop: 14 }}>
              {[
                ["integrity", "Integrity Weight"],
                ["links", "Link Weight"],
                ["drift", "Drift Weight"],
                ["threat", "Threat Weight"],
                ["trust", "Trust Weight"],
              ].map(([key, text]) => (
                <div key={key}>
                  <div style={label}>{text}</div>
                  <input
                    style={input}
                    type="number"
                    min={0}
                    max={20}
                    value={Number(config.weights[key as keyof SecurityConfig["weights"]] || 0)}
                    onChange={(e) => setConfig((prev) => ({ ...prev, weights: { ...prev.weights, [key]: Number(e.target.value || 0) } }))}
                  />
                </div>
              ))}
            </div>
          </section>

          <section style={box}>
            <div style={label}>Operator Notes</div>
            <textarea style={{ ...input, minHeight: 140 }} value={config.notes} onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))} />
          </section>

          <section style={{ ...box, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ color: "#ffb8b8" }}>
              Shared engine links:
              {related.map((item) => (
                <span key={item.route} style={{ marginLeft: 10 }}>
                  <Link href={buildDashboardHref(item.route)} style={{ color: "#ffb8b8" }}>{item.label}</Link>
                </span>
              ))}
            </div>
            <button onClick={() => void save()} disabled={saving} style={{ ...input, width: "auto", cursor: "pointer", fontWeight: 900 }}>
              {saving ? "Saving..." : `Save ${title}`}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
