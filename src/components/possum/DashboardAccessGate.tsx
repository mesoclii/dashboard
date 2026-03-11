"use client";

import { useEffect, useState } from "react";
import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

function getContext() {
  if (typeof window === "undefined") {
    return { guildId: "", userId: "" };
  }

  const params = new URLSearchParams(window.location.search);
  const guildId = String(params.get("guildId") || localStorage.getItem("activeGuildId") || "").trim();
  if (guildId) localStorage.setItem("activeGuildId", guildId);

  const userId = String(
    params.get("userId") ||
      params.get("uid") ||
      localStorage.getItem("dashboardUserId") ||
      MASTER_OWNER_USER_ID
  ).trim();
  if (userId) localStorage.setItem("dashboardUserId", userId);

  return { guildId, userId };
}

function accessReasonLabel(reason: string) {
  switch (reason) {
    case "ok_global_owner":
      return "Allowed by global owner override.";
    case "explicit_user_allowed":
      return "Allowed by the live dashboard allowlist.";
    case "explicit_user_denied":
      return "Denied by the live dashboard denylist.";
    case "ok_dashboard_policy_role":
      return "Allowed by the live dashboard role policy.";
    case "ok_native_admin":
      return "Allowed by guild owner or native Discord admin permissions.";
    case "ok_dashboard_access_role":
      return "Allowed by the configured dashboard access role.";
    case "ok_role_level":
      return "Allowed by the configured minimum role level.";
    case "member_not_found":
      return "Your account is not currently resolved as a guild member.";
    default:
      return "Dashboard access denied by the live guild access policy.";
  }
}

export default function DashboardAccessGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(true);
  const [reason, setReason] = useState("");
  const [warning, setWarning] = useState("");

  useEffect(() => {
    let mounted = true;

    (async () => {
      const context = getContext();
      let userId = context.userId;

      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        const sessionJson = await sessionRes.json().catch(() => ({}));
        if (!sessionJson?.loggedIn) {
          if (!mounted) return;
          setAllowed(false);
          setReason("Login required. Please connect Discord before entering the dashboard.");
          setReady(true);
          return;
        }

        userId = String(sessionJson?.user?.id || userId || "").trim();
        if (userId && typeof window !== "undefined") {
          localStorage.setItem("dashboardUserId", userId);
        }
      } catch {
        if (!mounted) return;
        setAllowed(false);
        setReason("Login session check failed. Please reload and log in again.");
        setReady(true);
        return;
      }

      if (!context.guildId || !userId) {
        if (!mounted) return;
        setReady(true);
        setAllowed(Boolean(!context.guildId));
        if (!context.guildId) return;
        setReason("Dashboard identity context missing. Please log in again.");
        return;
      }

      try {
        const accessRes = await fetch(
          `/api/bot/guild-access?guildId=${encodeURIComponent(context.guildId)}&userId=${encodeURIComponent(userId)}`,
          { cache: "no-store" }
        );
        const accessJson = await accessRes.json().catch(() => ({}));

        if (!mounted) return;

        if (!accessRes.ok || accessJson?.success === false) {
          throw new Error(accessJson?.error || "Live guild access check failed.");
        }

        setAllowed(Boolean(accessJson?.access));
        setReason(accessReasonLabel(String(accessJson?.reason || "")));
        setReady(true);
      } catch {
        if (!mounted) return;
        setAllowed(true);
        setWarning("Live access policy check failed. Continuing in safe-open mode for this session.");
        setReady(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) {
    return (
      <div
        style={{
          border: "1px solid #6f0000",
          borderRadius: 12,
          padding: 12,
          background: "rgba(120,0,0,0.10)",
          color: "#ffd3d3",
        }}
      >
        Checking dashboard access policy...
      </div>
    );
  }

  if (!allowed) {
    return (
      <div
        style={{
          border: "1px solid #8f0000",
          borderRadius: 12,
          padding: 16,
          background: "rgba(120,0,0,0.16)",
          color: "#ffd3d3",
          maxWidth: 860,
        }}
      >
        <h2 style={{ marginTop: 0, color: "#ff5555", letterSpacing: "0.10em", textTransform: "uppercase" }}>
          Access denied
        </h2>
        <p style={{ marginBottom: 12 }}>{reason}</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a
            href="/api/auth/discord/login"
            style={{
              border: "1px solid #7a0000",
              borderRadius: 10,
              padding: "8px 12px",
              color: "#ffd0d0",
              textDecoration: "none",
              fontWeight: 700,
              background: "#1a0000",
            }}
          >
            Login with Discord
          </a>
          <a
            href="/guilds"
            style={{
              border: "1px solid #7a0000",
              borderRadius: 10,
              padding: "8px 12px",
              color: "#ffd0d0",
              textDecoration: "none",
              fontWeight: 700,
              background: "#1a0000",
            }}
          >
            Return to Guild Select
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {warning ? (
        <div
          style={{
            border: "1px solid #8a4d00",
            borderRadius: 10,
            padding: 10,
            background: "rgba(120,70,0,0.16)",
            color: "#ffd9a3",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          {warning}
        </div>
      ) : null}
      {children}
    </>
  );
}
