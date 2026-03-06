type FetchGuildDataOptions = {
  userId?: string;
  baseUrl?: string;
  headers?: HeadersInit;
};

function resolveBaseUrl(explicit?: string): string {
  if (explicit) return explicit;
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_DASHBOARD_URL || process.env.DASHBOARD_URL || "http://127.0.0.1:3000";
}

export async function fetchGuildData(guildId: string, options: FetchGuildDataOptions = {}) {
  const id = String(guildId || "").trim();
  if (!id) throw new Error("guildId is required");

  const url = new URL("/api/bot/guild-data", resolveBaseUrl(options.baseUrl));
  url.searchParams.set("guildId", id);
  if (options.userId) url.searchParams.set("userId", options.userId);

  const res = await fetch(url.toString(), {
    cache: "no-store",
    headers: options.headers,
  });
  if (!res.ok) throw new Error("Guild fetch failed");
  return res.json();
}
