"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MatrixConfig = {
  preOnboardingEnabled: boolean;
  onboardingEnabled: boolean;
  verificationEnabled: boolean;
  lockdownEnabled: boolean;
  raidEnabled: boolean;
  moderatorEnabled: boolean;
  automationStudioEnabled: boolean;
  commandCenterEnabled: boolean;
  welcomeGoodbyeEnabled: boolean;
  profilesEnabled: boolean;
  notes: string;
};

type DashboardConfig = {
  features?: Record<string, boolean>;
};

type RuntimeStatus = {
  engine: string;
  title: string;
  route: string;
  summary: Array<{ label: string; value: string }>;
};

const DEFAULT_MATRIX: MatrixConfig = {
  preOnboardingEnabled: true,
  onboardingEnabled: true,
  verificationEnabled: true,
  lockdownEnabled: true,
  raidEnabled: true,
  moderatorEnabled: true,
  automationStudioEnabled: true,
  commandCenterEnabled: true,
  welcomeGoodbyeEnabled: true,
  profilesEnabled: true,
  notes: "",
};

const DIRECTORY_LINKS = [
  { label: "Security Engines", href: "/dashboard/security/engines", desc: "Editable engine directory and runtime coverage." },
  { label: "Engine Matrix", href: "/dashboard/security/engine-matrix", desc: "Visibility and enable-state matrix." },
  { label: "Profiles", href: "/dashboard/security/profiles", desc: "Security profiles and presets." },
  { label: "Policy", href: "/dashboard/security/policy", desc: "Security policy-level controls." },
  { label: "Lockdown", href: "/dashboard/security/lockdown", desc: "Emergency lockdown engine." },
  { label: "Raid", href: "/dashboard/security/raid", desc: "Raid detection and escalation." },
  { label: "Verification", href: "/dashboard/security/verification", desc: "Verification thresholds and routing." },
  { label: "Onboarding", href: "/dashboard/security/onboarding", desc: "Join flow and verification hooks." },
  { label: "Account Integrity", href: "/dashboard/security/account-integrity", desc: "Account risk profiling." },
  { label: "Threat Intel", href: "/dashboard/security/threat-intel", desc: "Threat-wave composition and response." },
  { label: "Containment", href: "/dashboard/security/containment", desc: "Containment and slowmode handling." },
  { label: "Forensics", href: "/dashboard/security/forensics", desc: "Audit visibility and incident trails." },
  { label: "Staff Activity", href: "/dashboard/security/staff-activity", desc: "Staff moderation oversight." },
];

const RUNTIME_ENGINES = [
  { engine: "security.accountIntegrity", title: "Account Integrity", route: "/dashboard/security/account-integrity" },
  { engine: "security.threatIntel", title: "Threat Intel", route: "/dashboard/security/threat-intel" },
  { engine: "security.containment", title: "Containment", route: "/dashboard/security/containment" },
  { engine: "security.enforcer", title: "Security Enforcer", route: "/dashboard/security-enforcer" },
  { engine: "security.forensics", title: "Forensics", route: "/dashboard/security/forensics" },
  { engine: "security.staffActivityMonitor", title: "Staff Activity", route: "/dashboard/security/staff-activity" },
];

function getGuildId(): string {
  if (typeof window === "undefined") return "";
  const fromUrl = new URLSearchParams(window.location.search).get("guildId") || "";
  const fromStore = localStorage.getItem("activeGuildId") || "";
  const gid = (fromUrl || fromStore).trim();
  if (gid) localStorage.setItem("activeGuildId", gid);
  return gid;
}

function guildHref(href: string, guildId: string) {
  if (!guildId) return href;
  const joiner = href.includes("?") ? "&" : "?";
  return `${href}${joiner}guildId=${encodeURIComponent(guildId)}`;
}

function pill(on: boolean) {
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${on ? "#1f8a3f" : "#8a2f2f"}`,
    color: on ? "#88ffb1" : "#ff9a9a",
    fontWeight: 800,
    fontSize: 12,
    letterSpacing: "0.06em",
  } as React.CSSProperties;
}

const box: React.CSSProperties = {
  border: "1px solid #6f0000",
  borderRadius: 12,
  padding: 14,
  background: "rgba(120,0,0,0.08)",
  marginBottom: 14,
};

const input: React.CSSProperties = {
  width: "100%",
  background: "#0c0c0c",
  color: "#ffd6d6",
  border: "1px solid #7f0000",
  borderRadius: 8,
  padding: "9px 10px",
};

const btn: React.CSSProperties = {
  border: "1px solid #a30000",
  borderRadius: 10,
  background: "#1a0000",
  color: "#ffcccc",
  padding: "8px 12px",
  cursor: "pointer",
  fontWeight: 700,
};

export default function SecurityPage() {
  const [guildId, setGuildId] = useState("");
  const [guildName, setGuildName] = useState("");
  const [dashboard, setDashboard] = useState<DashboardConfig>({});
  const [matrix, setMatrix] = useState<MatrixConfig>(DEFAULT_MATRIX);
  const [runtime, setRuntime] = useState<RuntimeStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    setGuildId(getGuildId());
    if (typeof window !== "undefined") {
      setGuildName(localStorage.getItem("activeGuildName") || "");
    }
  }, []);

  async function loadAll(targetGuildId: string) {
    if (!targetGuildId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMsg("");
      const [dashboardRes, matrixRes] = await Promise.all([
        fetch(`/api/bot/dashboard-config?guildId=${encodeURIComponent(targetGuildId)}`, { cache: "no-store" }),
        fetch(`/api/setup/security-engine-matrix-config?guildId=${encodeURIComponent(targetGuildId)}`, { cache: "no-store" }),
      ]);

      const dashboardJson = await dashboardRes.json().catch(() => ({}));
      const matrixJson = await matrixRes.json().catch(() => ({}));

      setDashboard(dashboardJson?.config || {});
      setMatrix({ ...DEFAULT_MATRIX, ...(matrixJson?.config || {}) });

      const runtimePayloads = await Promise.all(
        RUNTIME_ENGINES.map(async (item) => {
          const res = await fetch(
            `/api/setup/runtime-engine?guildId=${encodeURIComponent(targetGuildId)}&engine=${encodeURIComponent(item.engine)}`,
            { cache: "no-store" }
          );
          const json = await res.json().catch(() => ({}));
          return {
            ...item,
            summary: Array.isArray(json?.summary) ? json.summary : [],
          };
        })
      );
      setRuntime(runtimePayloads);
    } catch (error: any) {
      setMsg(error?.message || "Failed to load security command center.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll(guildId);
  }, [guildId]);

  const features = dashboard?.features || {};
  const liveSummary = useMemo(
    () => [
      { label: "Governance", value: Boolean(features.governanceEnabled) },
      { label: "Onboarding", value: Boolean(features.onboardingEnabled) },
      { label: "Verification", value: Boolean(features.verificationEnabled) },
      { label: "Lockdown", value: Boolean(features.lockdownEnabled) },
      { label: "Raid", value: Boolean(features.raidEnabled) },
    ],
    [features]
  );

  async function saveAll() {
    if (!guildId) return;
    setSaving(true);
    setMsg("");
    try {
      let res = await fetch("/api/bot/dashboard-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guildId,
          patch: {
            features: {
              governanceEnabled: true,
              onboardingEnabled: matrix.onboardingEnabled,
              verificationEnabled: matrix.verificationEnabled,
              lockdownEnabled: matrix.lockdownEnabled,
              raidEnabled: matrix.raidEnabled,
            },
          },
        }),
      });
      let json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Failed to save dashboard security flags.");

      res = await fetch("/api/setup/security-engine-matrix-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildId, patch: matrix }),
      });
      json = await res.json().catch(() => ({}));
      if (!res.ok || json?.success === false) throw new Error(json?.error || "Failed to save security engine matrix.");

      for (const [engine, enabled] of [
        ["lockdown", matrix.lockdownEnabled],
        ["raid", matrix.raidEnabled],
      ] as const) {
        res = await fetch("/api/bot/engine-config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ guildId, engine, patch: { enabled } }),
        });
        json = await res.json().catch(() => ({}));
        if (!res.ok || json?.success === false) throw new Error(json?.error || `Failed to sync ${engine}.`);
      }

      setMsg("Security command center saved and synced.");
      await loadAll(guildId);
    } catch (error: any) {
      setMsg(error?.message || "Failed to save security command center.");
    } finally {
      setSaving(false);
    }
  }

  if (!guildId) {
    return <div style={{ color: "#ff6b6b", padding: 24 }}>Missing guildId. Open from /guilds first.</div>;
  }

  return (
    <div style={{ color: "#ffd0d0", padding: 18, maxWidth: 1400 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase" }}>Control Surface</div>
          <h1 style={{ margin: "8px 0 0", color: "#ff4f4f", letterSpacing: "0.10em", textTransform: "uppercase" }}>Security Command Center</h1>
          <div style={{ color: "#ff8d8d", marginTop: 8 }}>Guild: {guildName || guildId}</div>
        </div>
        <button style={btn} onClick={saveAll} disabled={saving}>
          {saving ? "Saving..." : "Save Security"}
        </button>
      </div>

      <div style={{ marginTop: 10, color: "#ffb1b1", lineHeight: 1.7, maxWidth: 1120 }}>
        This is the live security command center for the active guild. It controls the master security feature state, syncs lockdown and raid engine
        toggles, exposes live runtime summaries from the heavier sub-engines, and links into the deeper operator tabs when you need full per-engine detail.
      </div>

      {msg ? (
        <div style={{ ...box, color: "#ffd27a" }}>
          {msg}
        </div>
      ) : null}

      {loading ? (
        <div style={box}>Loading security command center...</div>
      ) : (
        <>
          <section style={box}>
            <h2 style={{ marginTop: 0, color: "#ff5b5b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Master Runtime Status</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10 }}>
              {liveSummary.map((item) => (
                <div key={item.label} style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 12, background: "#100000" }}>
                  <div style={{ color: "#ff9a9a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em" }}>{item.label}</div>
                  <div style={{ marginTop: 8 }}>
                    <span style={pill(item.value)}>{item.value ? "ON" : "OFF"}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={box}>
            <h2 style={{ marginTop: 0, color: "#ff5b5b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Master Controls</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 14 }}>
              {[
                ["onboardingEnabled", "Onboarding"],
                ["verificationEnabled", "Verification"],
                ["lockdownEnabled", "Lockdown"],
                ["raidEnabled", "Raid"],
                ["moderatorEnabled", "Moderator"],
                ["automationStudioEnabled", "Automation Studio"],
                ["commandCenterEnabled", "Command Center"],
                ["welcomeGoodbyeEnabled", "Welcome + Goodbye"],
                ["profilesEnabled", "Profiles"],
                ["preOnboardingEnabled", "Pre-Onboarding"],
              ].map(([key, labelText]) => (
                <label key={key} style={{ display: "inline-flex", gap: 8, alignItems: "center", color: "#ffdcdc", fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={Boolean((matrix as any)[key])}
                    onChange={(e) => setMatrix((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  {labelText}
                </label>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ color: "#ffb0b0", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6 }}>Command Center Notes</div>
              <textarea
                style={{ ...input, minHeight: 120 }}
                value={matrix.notes || ""}
                onChange={(e) => setMatrix((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </section>

          <section style={box}>
            <h2 style={{ marginTop: 0, color: "#ff5b5b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Live Threat Stack</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
              {runtime.map((item) => (
                <div key={item.engine} style={{ border: "1px solid #4f0000", borderRadius: 10, padding: 14, background: "#100000" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                    <div style={{ color: "#ff5252", fontWeight: 900, letterSpacing: "0.06em", textTransform: "uppercase" }}>{item.title}</div>
                    <Link href={guildHref(item.route, guildId)} style={{ color: "#ffd0d0", textDecoration: "none", ...pill(true) }}>
                      Open
                    </Link>
                  </div>
                  <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                    {item.summary.length ? item.summary.map((row) => (
                      <div key={`${item.engine}:${row.label}`} style={{ color: "#ffbcbc", fontSize: 13 }}>
                        <b>{row.label}:</b> {row.value}
                      </div>
                    )) : <div style={{ color: "#ffbcbc", fontSize: 13 }}>No live summary returned yet.</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section style={box}>
            <h2 style={{ marginTop: 0, color: "#ff5b5b", letterSpacing: "0.08em", textTransform: "uppercase" }}>Deeper Operator Tabs</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
              {DIRECTORY_LINKS.map((item) => (
                <Link
                  key={item.href}
                  href={guildHref(item.href, guildId)}
                  style={{
                    display: "block",
                    border: "1px solid #5f0000",
                    borderRadius: 10,
                    padding: 12,
                    background: "#100000",
                    textDecoration: "none",
                    color: "#ffd0d0",
                  }}
                >
                  <div style={{ color: "#ff4d4d", fontWeight: 800, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5, color: "#ffbcbc" }}>{item.desc}</div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
