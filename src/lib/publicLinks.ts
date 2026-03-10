const DISCORD_CLIENT_ID = "1472526506201841695";

export function buildPublicInviteUrl(guildId?: string) {
  const url = new URL("https://discord.com/oauth2/authorize");
  url.searchParams.set("client_id", DISCORD_CLIENT_ID);
  url.searchParams.set("scope", "bot applications.commands");
  url.searchParams.set("permissions", "8");
  const redirectUri = String(process.env.NEXT_PUBLIC_DISCORD_INVITE_REDIRECT_URI || "").trim();
  if (redirectUri) {
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", redirectUri);
  }
  if (guildId) {
    url.searchParams.set("guild_id", guildId);
    url.searchParams.set("disable_guild_select", "true");
  }
  return url.toString();
}
