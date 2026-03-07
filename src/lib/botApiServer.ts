import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";

export const SERVER_BOT_API = String(process.env.BOT_API_URL || "http://127.0.0.1:3001").trim();

const DASHBOARD_TOKEN = String(process.env.DASHBOARD_API_TOKEN || "").trim();

export function buildServerBotApiHeaders(userId?: string) {
  const headers: Record<string, string> = {};
  if (DASHBOARD_TOKEN) headers["x-dashboard-token"] = DASHBOARD_TOKEN;
  headers["x-dashboard-user-id"] = String(userId || MASTER_OWNER_USER_ID).trim() || MASTER_OWNER_USER_ID;
  return headers;
}

export async function readServerBotApiJson(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { success: false, error: text || "Invalid upstream JSON" };
  }
}
