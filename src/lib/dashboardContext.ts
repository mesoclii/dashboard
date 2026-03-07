import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

function readSearchParam(name: string): string {
  if (typeof window === "undefined") return "";
  return String(new URLSearchParams(window.location.search).get(name) || "").trim();
}

export function readDashboardGuildId(): string {
  if (typeof window === "undefined") return "";
  const guildId = String(
    readSearchParam("guildId") ||
      readSearchParam("guildid") ||
      localStorage.getItem("activeGuildId") ||
      localStorage.getItem("activeGuildid") ||
      ""
  ).trim();
  if (guildId) {
    localStorage.setItem("activeGuildId", guildId);
    localStorage.setItem("activeGuildid", guildId);
  }
  return guildId;
}

export function readDashboardUserId(): string {
  if (typeof window === "undefined") return MASTER_OWNER_USER_ID;
  const userId = String(
    readSearchParam("userId") ||
      readSearchParam("uid") ||
      localStorage.getItem("dashboardUserId") ||
      MASTER_OWNER_USER_ID
  ).trim();
  if (userId) {
    localStorage.setItem("dashboardUserId", userId);
  }
  return userId;
}

export function buildDashboardHref(
  href: string,
  options: { includeGuild?: boolean; includeUser?: boolean } = {}
): string {
  if (typeof window === "undefined") return href;

  const includeGuild = options.includeGuild !== false;
  const includeUser = options.includeUser !== false;
  const url = new URL(href, "http://dashboard.local");
  const guildId = readDashboardGuildId();
  const userId = readDashboardUserId();

  if (includeGuild && guildId && !url.searchParams.get("guildId")) {
    url.searchParams.set("guildId", guildId);
  }
  if (includeUser && userId && !url.searchParams.get("userId")) {
    url.searchParams.set("userId", userId);
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
