"use client";

import Link from "next/link";
import { buildDashboardHref } from "@/lib/dashboardContext";
import { getEngineSpec } from "@/lib/dashboardEngineCatalog";

const shell: React.CSSProperties = {
  border: "1px solid rgba(255,0,0,.34)",
  borderRadius: 14,
  background: "rgba(90,0,0,.12)",
  padding: 16,
  display: "grid",
  gap: 14,
};

const sectionTitle: React.CSSProperties = {
  color: "#ff9a9a",
  fontSize: 11,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
};

const linkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 12px",
  borderRadius: 10,
  textDecoration: "none",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  fontWeight: 900,
  fontSize: 12,
  border: "1px solid rgba(255,0,0,.34)",
  color: "#ffdcdc",
  background: "#120707",
};

export default function EngineContractPanel({
  engineKey,
  title,
  intro,
  related = [],
}: {
  engineKey: string;
  title?: string;
  intro?: string;
  related?: Array<{ label: string; route: string; reason?: string }>;
}) {
  const spec = getEngineSpec(engineKey);
  if (!spec) return null;

  return (
    <section style={shell}>
      <div>
        <div style={sectionTitle}>Engine Surface</div>
        <div style={{ color: "#ff4545", fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.10em", marginTop: 6 }}>
          {title || spec.displayName}
        </div>
        <div style={{ color: "#ffd0d0", lineHeight: 1.7, marginTop: 8 }}>
          {intro || spec.decisionLogic}
        </div>
      </div>

      {related.length ? (
        <div>
          <div style={sectionTitle}>Linked Surfaces</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
            {related.map((item) => (
              <Link key={`${engineKey}:${item.route}`} href={buildDashboardHref(item.route)} style={linkStyle}>
                {item.label}
              </Link>
            ))}
          </div>
          <div style={{ color: "#ffb7b7", lineHeight: 1.7, marginTop: 10 }}>
            {related
              .map((item) => `${item.label}: ${item.reason || "linked operational surface"}`)
              .join(" | ")}
          </div>
        </div>
      ) : null}
    </section>
  );
}
