import { NextRequest, NextResponse } from "next/server";
import { buildDiscordInviteUrl } from "@/lib/discordOAuth";

export async function GET(req: NextRequest) {
  try {
    const guildId = String(req.nextUrl.searchParams.get("guildId") || "").trim() || undefined;
    const inviteUrl = buildDiscordInviteUrl({ guildId });
    return NextResponse.redirect(inviteUrl);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to build Discord invite URL." },
      { status: 500 }
    );
  }
}
