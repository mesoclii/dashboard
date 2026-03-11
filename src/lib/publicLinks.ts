const INVITE_PATH = "/api/auth/discord/invite";

export function buildPublicInviteUrl(guildId?: string) {
  if (!guildId) return INVITE_PATH;
  const params = new URLSearchParams({ guildId });
  return `${INVITE_PATH}?${params.toString()}`;
}
