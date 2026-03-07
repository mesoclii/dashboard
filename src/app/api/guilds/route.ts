import { NextRequest, NextResponse } from "next/server";
import {
  fetchDiscordGuilds,
  getDiscordGuildIconUrl,
  hasGuildManageAccess,
  isDiscordOauthConfigured,
} from "@/lib/discordOAuth";
import { DASHBOARD_SESSION_COOKIE, readDashboardSessionValue } from "@/lib/session";

export async function GET(request: NextRequest) {
  if (!isDiscordOauthConfigured()) {
    return NextResponse.json({
      success: true,
      oauthConfigured: false,
      loggedIn: false,
      user: null,
      guilds: [],
    });
  }

  const session = readDashboardSessionValue(request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({
      success: true,
      oauthConfigured: true,
      loggedIn: false,
      user: null,
      guilds: [],
    });
  }

  try {
    const guilds = await fetchDiscordGuilds(session.accessToken);
    const manageableGuilds = guilds
      .filter((guild) => hasGuildManageAccess(guild))
      .map((guild) => ({
        id: String(guild.id),
        name: String(guild.name || guild.id),
        icon: guild.icon || null,
        iconUrl: getDiscordGuildIconUrl(String(guild.id), guild.icon),
        owner: guild.owner === true,
        permissions: String(guild.permissions_new || guild.permissions || ""),
        manageable: true,
        botPresent: false,
      }));

    return NextResponse.json({
      success: true,
      oauthConfigured: true,
      loggedIn: true,
      user: session.user,
      guilds: manageableGuilds,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        oauthConfigured: true,
        loggedIn: false,
        user: null,
        guilds: [],
        error: error?.message || "Failed to load Discord guilds.",
      },
      { status: 500 }
    );
  }
}
