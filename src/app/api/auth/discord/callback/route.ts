import { NextRequest, NextResponse } from "next/server";
import {
  exchangeDiscordCode,
  fetchDiscordUser,
  isDiscordOauthConfigured,
} from "@/lib/discordOAuth";
import {
  createDashboardSessionValue,
  DASHBOARD_OAUTH_STATE_COOKIE,
  DASHBOARD_SESSION_COOKIE,
  isDashboardSessionConfigured,
  useSecureCookies,
} from "@/lib/session";

export async function GET(request: NextRequest) {
  if (!isDiscordOauthConfigured() || !isDashboardSessionConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Discord OAuth/session env values are not configured.",
      },
      { status: 500 }
    );
  }

  const code = String(request.nextUrl.searchParams.get("code") || "").trim();
  const state = String(request.nextUrl.searchParams.get("state") || "").trim();
  const storedState = String(request.cookies.get(DASHBOARD_OAUTH_STATE_COOKIE)?.value || "").trim();

  if (!code) {
    return NextResponse.json({ success: false, error: "Missing OAuth code." }, { status: 400 });
  }

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ success: false, error: "OAuth state mismatch." }, { status: 400 });
  }

  const token = await exchangeDiscordCode(code);
  const user = await fetchDiscordUser(token.access_token);

  const sessionValue = createDashboardSessionValue({
    user: {
      id: String(user.id),
      username: String(user.username || "Discord User"),
      globalName: user.global_name ?? null,
      avatar: user.avatar ?? null,
    },
    accessToken: token.access_token,
    expiresAt: Date.now() + Number(token.expires_in || 604800) * 1000,
  });

  const redirectUrl = new URL("/guilds", request.nextUrl.origin);
  redirectUrl.searchParams.set("userId", String(user.id));

  const response = NextResponse.redirect(redirectUrl);
  response.cookies.set(DASHBOARD_SESSION_COOKIE, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookies(),
    path: "/",
    maxAge: Math.max(60, Number(token.expires_in || 604800)),
  });
  response.cookies.delete(DASHBOARD_OAUTH_STATE_COOKIE);
  return response;
}
