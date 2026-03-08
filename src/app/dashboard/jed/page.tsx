"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import EngineContractPanel from "@/components/possum/EngineContractPanel";
import EngineInsights from "@/components/possum/EngineInsights";
import { useGuildEngineEditor } from "@/components/possum/useGuildEngineEditor";
import { buildDashboardHref } from "@/lib/dashboardContext";

type JedConfig = {
  enabled: boolean;
  batchLimit: number;
  publicTTL: number;
  tempTTL: number;
  maxFileSizeMb: number;
  allowedDomains: string[];
  auditChannelId: string;
  notes: string;
};

const DEFAULT_CONFIG: JedConfig = {
  enabled: true,
  batchLimit: 1,
  publicTTL: 45,
  tempTTL: 60,
  maxFileSizeMb: 5,
  allowedDomains: ["cdn.discordapp.com", "media.discordapp.net", "i.imgur.com"],
  auditChannelId: "",
  notes: "",
};

const shell: CSSProperties = { color: "#ffd0d0", padding: 18, maxWidth: 1440 };
const box: CSSProperties = {
  border: "1px solid #5f0000",
  borderRadius: 14,
  padding: 16,
  background: "linear-gradient(180deg, rgba(120,0,0,0.12), rgba(0,0,0,0.72))",
  marginTop: 12,
};
const input: CSSProperties = {
  width: "100%",
  background: "#0a0a0a",
  color: "#ffd0d0",
  border: "1px solid #7f0000",
  borderRadius: 10,
  padding: "10px 12px",
};
const button: CSSProperties = {
  ...input,
  width: "auto",
  cursor: "pointer",
  fontWeight: 900,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};
const label: CSSProperties = {
  color: "#ffb9b9",
  fontSize: 12,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  marginBottom: 6,
};

function lines(value: string) {
  return value
    .split(/\r?\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function JedPage() {
  const { guildId, guildName, config, setConfig, channels, summary, details, loading, saving, message, save, runAction } =
    useGuildEngineEditor<JedConfig>("jed", DEFAULT_CONFIG);

  const textChannels = channels.filter((channel) => Number(channel?.type) === 0 || Number(channel?.type) === 5);

  if (!guildId) {
    return <div style={{ ...shell, color: "#ff8080" }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <section style={shell}>
      <h1 style={{ margin: 0, color: "#ff4f4f", letterSpacing: "0.10em", textTransform: "uppercase" }}>Jed Engine</h1>
      <div style={{ color: "#ff9999", marginTop: 6, marginBottom: 12 }}>Guild: {guildName || guildId}</div>
      <div style={{ color: "#ffbcbc", lineHeight: 1.7, maxWidth: 1120 }}>
        Jed is the asset conversion and deploy engine. This page now edits the live guild-level batch limits, source allowlist, file-size guardrails,
        public message TTL, cleanup retention, and operator notes while exposing recent usage and top operators from the live bot runtime.
      </div>

      <EngineContractPanel
        engineKey="jed"
        intro="Sticker, emoji, and media conversion controls with direct domain allowlisting, temporary-file cleanup, and guild-level throughput limits."
        related={[
          { label: "System Health", route: "/dashboard/system-health", reason: "check resource pressure before large media runs" },
          { label: "Runtime Router", route: "/dashboard/runtime-router", reason: "separate runtime operations surface" },
        ]}
      />

      {message ? <div style={{ marginTop: 12, color: "#ffd27a" }}>{message}</div> : null}

      {loading ? (
        <div style={box}>Loading JED runtime...</div>
      ) : (
        <>
          <EngineInsights summary={summary} details={details} />

          <section style={box}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <div style={label}>Live JED Actions</div>
                <div style={{ color: "#ffbcbc", lineHeight: 1.7 }}>
                  Refresh the merged live config from the bot runtime or clear temp conversion files for this guild without leaving the dashboard.
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={button} disabled={saving} onClick={() => void runAction("refreshConfig")}>
                  Refresh Runtime Config
                </button>
                <button style={button} disabled={saving} onClick={() => void runAction("cleanupTemp")}>
                  Cleanup Temp Files
                </button>
              </div>
            </div>
          </section>

          <section style={box}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              <label style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
                <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig((prev) => ({ ...prev, enabled: e.target.checked }))} />
                Engine Enabled
              </label>
              <div>
                <div style={label}>Batch Limit</div>
                <input
                  style={input}
                  type="number"
                  min={1}
                  max={25}
                  value={config.batchLimit}
                  onChange={(e) => setConfig((prev) => ({ ...prev, batchLimit: Math.max(1, Number(e.target.value || 1)) }))}
                />
              </div>
              <div>
                <div style={label}>Public Result TTL (sec)</div>
                <input
                  style={input}
                  type="number"
                  min={5}
                  max={600}
                  value={config.publicTTL}
                  onChange={(e) => setConfig((prev) => ({ ...prev, publicTTL: Math.max(5, Number(e.target.value || 45)) }))}
                />
              </div>
              <div>
                <div style={label}>Temp Cleanup TTL (sec)</div>
                <input
                  style={input}
                  type="number"
                  min={5}
                  max={3600}
                  value={config.tempTTL}
                  onChange={(e) => setConfig((prev) => ({ ...prev, tempTTL: Math.max(5, Number(e.target.value || 60)) }))}
                />
              </div>
              <div>
                <div style={label}>Max File Size (MB)</div>
                <input
                  style={input}
                  type="number"
                  min={1}
                  max={100}
                  value={config.maxFileSizeMb}
                  onChange={(e) => setConfig((prev) => ({ ...prev, maxFileSizeMb: Math.max(1, Number(e.target.value || 5)) }))}
                />
              </div>
              <div>
                <div style={label}>Audit Channel</div>
                <select style={input} value={config.auditChannelId || ""} onChange={(e) => setConfig((prev) => ({ ...prev, auditChannelId: e.target.value }))}>
                  <option value="">Not set</option>
                  {textChannels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      #{channel.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section style={box}>
            <div style={label}>Allowed Source Domains</div>
            <textarea
              style={{ ...input, minHeight: 120 }}
              value={config.allowedDomains.join("\n")}
              onChange={(e) => setConfig((prev) => ({ ...prev, allowedDomains: lines(e.target.value) }))}
            />
            <div style={{ marginTop: 10, color: "#ffbcbc", lineHeight: 1.7 }}>
              Only these hostnames can be converted by JED. This is the per-guild live allowlist used by the runtime now, not a placeholder list.
            </div>
          </section>

          <section style={box}>
            <div style={label}>Operator Notes</div>
            <textarea
              style={{ ...input, minHeight: 140 }}
              value={config.notes}
              onChange={(e) => setConfig((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </section>

          <section style={{ ...box, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ color: "#ffbcbc" }}>
              Shared links:
              <span style={{ marginLeft: 10 }}>
                <Link href={buildDashboardHref("/dashboard/system-health")} style={{ color: "#ffd0d0" }}>
                  System Health
                </Link>
              </span>
              <span style={{ marginLeft: 10 }}>
                <Link href={buildDashboardHref("/dashboard/runtime-router")} style={{ color: "#ffd0d0" }}>
                  Runtime Router
                </Link>
              </span>
            </div>
            <button style={button} disabled={saving} onClick={() => void save()}>
              {saving ? "Saving..." : "Save JED"}
            </button>
          </section>
        </>
      )}
    </section>
  );
}
