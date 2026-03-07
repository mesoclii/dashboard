import crypto from "node:crypto";

export const DASHBOARD_SESSION_COOKIE = "possum_dashboard_session";
export const DASHBOARD_OAUTH_STATE_COOKIE = "possum_dashboard_oauth_state";

export type DashboardDiscordUser = {
  id: string;
  username: string;
  globalName: string | null;
  avatar: string | null;
};

export type DashboardSession = {
  user: DashboardDiscordUser;
  accessToken: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = String(process.env.SESSION_SECRET || "").trim();
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured.");
  }
  return secret;
}

function sign(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeJsonParse(input: string): DashboardSession | null {
  try {
    return JSON.parse(input) as DashboardSession;
  } catch {
    return null;
  }
}

export function isDashboardSessionConfigured() {
  return Boolean(String(process.env.SESSION_SECRET || "").trim());
}

export function createDashboardSessionValue(session: DashboardSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function readDashboardSessionValue(rawValue: string | undefined | null) {
  if (!rawValue) return null;

  const split = rawValue.split(".");
  if (split.length !== 2) return null;

  const [payload, signature] = split;
  const expected = sign(payload);

  const signatureBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const json = Buffer.from(payload, "base64url").toString("utf8");
  const session = safeJsonParse(json);
  if (!session) return null;
  if (!session.accessToken || !session.user?.id) return null;
  if (!Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
  return session;
}

export function createOauthState() {
  return crypto.randomBytes(24).toString("hex");
}

export function useSecureCookies() {
  return String(process.env.DISCORD_REDIRECT_URI || "").trim().startsWith("https://");
}
