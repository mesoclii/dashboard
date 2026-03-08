"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  formatEngineList,
  getEngineSpec,
  PROGRESSION_STACK,
  type ProgressionStackKey,
} from "@/lib/dashboardEngineCatalog";
import { buildDashboardHref } from "@/lib/dashboardContext";

const shellCard: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.34)",
  borderRadius: 14,
  background: "rgba(90,0,0,.12)",
  padding: 16,
};

const tabBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid rgba(255,0,0,.30)",
};

const relationshipCopy: Record<ProgressionStackKey, string> = {
  progression:
    "Progression is the event intake layer. Messages, invites, games, onboarding, economy actions, and AI interactions all feed counters here before unlock systems above it react.",
  achievements:
    "Achievements sit on top of progression events. This layer watches the tracked actions, grants milestones, and pushes badge-panel or announce behavior when thresholds are met.",
  hallOfFame:
    "Hall Of Fame is the recognition layer. It reads the achievement output and surfaces top achievers instead of driving the progression loop itself.",
  loyalty:
    "Loyalty is the long-tail retention layer. It is separate from raw XP, but it feeds benefit timing and reward consistency that matter across VIP, radio, and prestige value.",
  prestige:
    "Prestige is the late-loop reset and elevation layer. In your current build, achievement prestige also exists as a separate milestone path once a user clears a high achievement threshold.",
};

export default function ProgressionStackShell({
  activeKey,
  title,
  subtitle,
  children,
}: {
  activeKey: ProgressionStackKey;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  const activeSpec = getEngineSpec(activeKey);

  return (
    <div style={{ display: "grid", gap: 14, marginBottom: 14 }}>
      <section style={shellCard}>
        <div style={{ color: "#ff9a9a", fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Linked Progression Stack
        </div>
        <div
          style={{
            color: "#ff4040",
            fontSize: 28,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "0.10em",
            marginTop: 8,
          }}
        >
          {title}
        </div>
        <div style={{ color: "#ffd0d0", lineHeight: 1.7, maxWidth: 980, marginTop: 8 }}>{subtitle}</div>
        <div style={{ color: "#ffb2b2", lineHeight: 1.7, maxWidth: 980, marginTop: 8 }}>{relationshipCopy[activeKey]}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          {PROGRESSION_STACK.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={buildDashboardHref(item.route)}
                style={{
                  ...tabBase,
                  color: active ? "#190000" : "#ffd6d6",
                  background: active ? "linear-gradient(90deg,#ff3f3f,#ff8440)" : "#120707",
                  borderColor: active ? "rgba(255,120,80,.65)" : "rgba(255,0,0,.30)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </section>

      {activeSpec ? (
        <section style={{ ...shellCard, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          <div>
            <div style={{ color: "#ff9a9a", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Engine Contract</div>
            <div style={{ color: "#fff", fontWeight: 900, fontSize: 20, marginTop: 6 }}>{activeSpec.displayName}</div>
            <div style={{ color: "#ffd0d0", lineHeight: 1.7, marginTop: 8 }}>{activeSpec.decisionLogic}</div>
          </div>

          <div>
            <div style={{ color: "#ff9a9a", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Runtime</div>
            <div style={{ color: "#ffdede", lineHeight: 1.7, marginTop: 8 }}>
              <div>Category: {activeSpec.category}</div>
              <div>Feature Flag: {activeSpec.featureFlag || "None"}</div>
              <div>Config Key: {activeSpec.configKey || "None"}</div>
              <div>Premium: {activeSpec.premiumRequired ? "Yes" : "No"}</div>
              <div>Private Only: {activeSpec.privateOnly ? "Yes" : "No"}</div>
              <div>Default: {activeSpec.enabledByDefault ? "On" : "Off"}</div>
              <div>Triggers: {formatEngineList(activeSpec.triggerTypes)}</div>
            </div>
          </div>

          <div>
            <div style={{ color: "#ff9a9a", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Dependencies</div>
            <div style={{ color: "#ffdede", lineHeight: 1.7, marginTop: 8 }}>
              <div>Services: {formatEngineList(activeSpec.hardDependencies.services || [])}</div>
              <div>Runtime Flags: {formatEngineList(activeSpec.hardDependencies.runtimeFlags || [])}</div>
              <div>Env / Hard Inputs: {formatEngineList(activeSpec.hardDependencies.envVars || [])}</div>
              <div>Persistence: {formatEngineList(activeSpec.persistence)}</div>
            </div>
          </div>

          <div>
            <div style={{ color: "#ff9a9a", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase" }}>Side Effects</div>
            <div style={{ color: "#ffdede", lineHeight: 1.7, marginTop: 8 }}>
              <div>Mutations: {formatEngineList(activeSpec.stateMutations)}</div>
              <div>Outputs: {formatEngineList(activeSpec.outputs)}</div>
              <div>Failure Modes: {formatEngineList(activeSpec.failureModes)}</div>
            </div>
          </div>
        </section>
      ) : null}

      {children}
    </div>
  );
}
