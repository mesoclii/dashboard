import { NextRequest, NextResponse } from "next/server";
import { buildDiscordOauthUrl, isDiscordOauthConfigured } from "@/lib/discordOAuth";
import { auditDashboardEvent } from "@/lib/dashboardAudit";
import { enforceDashboardRateLimit, isRateLimitError } from "@/lib/rateLimiter";
import {
  DASHBOARD_OAUTH_STATE_COOKIE,
  DASHBOARD_RETURN_TO_COOKIE,
  createOauthState,
  isDashboardSessionConfigured,
  sanitizeDashboardReturnTo,
  useSecureCookies,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    await enforceDashboardRateLimit(request, "oauth_login");
  } catch (error: any) {
    if (isRateLimitError(error)) {
      return NextResponse.json({ success: false, error: "Too many login attempts. Please retry shortly." }, { status: 429 });
    }
  }

  if (!isDiscordOauthConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Discord OAuth is not configured. Add DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and DISCORD_REDIRECT_URI to the dashboard env.",
      },
      { status: 500 }
    );
  }

  if (!isDashboardSessionConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Dashboard sessions are not configured. Add SESSION_SECRET to the dashboard env.",
      },
      { status: 500 }
    );
  }

  const state = createOauthState();
  const referer = String(request.headers.get("referer") || "").trim();
  let inferredReturnTo = request.nextUrl.searchParams.get("returnTo") || "";
  if (!inferredReturnTo && referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.origin === request.nextUrl.origin) {
        inferredReturnTo = `${refererUrl.pathname}${refererUrl.search}${refererUrl.hash}`;
      }
    } catch {}
  }
  const returnTo = sanitizeDashboardReturnTo(inferredReturnTo);
  const response = NextResponse.redirect(buildDiscordOauthUrl(state));

  response.cookies.set(DASHBOARD_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(),
    path: "/",
    maxAge: 60 * 10,
  });
  response.cookies.set(DASHBOARD_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(),
    path: "/",
    maxAge: 60 * 10,
  });

  void auditDashboardEvent({
    area: "oauth",
    action: "discord_login_redirect",
    severity: "info",
    metadata: { returnTo },
  });

  return response;
}
