import { NextRequest, NextResponse } from "next/server";
import { buildServerBotApiHeaders, readServerBotApiJson, SERVER_BOT_API } from "@/lib/botApiServer";
import { MASTER_OWNER_USER_ID } from "@/lib/dashboardOwner";
import { DASHBOARD_SESSION_COOKIE, readDashboardSessionValue } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = readDashboardSessionValue(request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value);
  const actorUserId = String(session?.user?.id || MASTER_OWNER_USER_ID).trim() || MASTER_OWNER_USER_ID;

  try {
    const params = new URLSearchParams();
    if (actorUserId) params.set("userId", actorUserId);

    const upstream = await fetch(`${SERVER_BOT_API}/guilds${params.toString() ? `?${params.toString()}` : ""}`, {
      headers: buildServerBotApiHeaders(actorUserId),
      cache: "no-store",
    });

    const data = await readServerBotApiJson(upstream);
    const guilds = Array.isArray(data?.guilds)
      ? data.guilds.map((guild: any) => ({
          id: String(guild?.id || ""),
          name: String(guild?.name || guild?.id || ""),
          icon: guild?.icon || null,
          ownerId: guild?.ownerId || null,
          memberCount: Number(guild?.memberCount || 0),
          accessReason: guild?.accessReason || null,
          botPresent: guild?.botPresent !== false,
        }))
      : [];

    return NextResponse.json(
      {
        success: upstream.ok && data?.success !== false,
        guilds,
        inviteUrl: typeof data?.inviteUrl === "string" ? data.inviteUrl : null,
      },
      { status: upstream.ok ? 200 : upstream.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        guilds: [],
        inviteUrl: null,
        error: error?.message || "Failed to load bot-installed guilds.",
      },
      { status: 500 }
    );
  }
}
