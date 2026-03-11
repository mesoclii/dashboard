import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function readParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

export default async function Page({ searchParams }: PageProps) {
  const resolved = (await searchParams) || {};
  const params = new URLSearchParams();
  const guildId = readParam(resolved.guildId);
  const userId = readParam(resolved.userId);

  if (guildId) params.set("guildId", guildId);
  if (userId) params.set("userId", userId);

  redirect(`/dashboard/games${params.toString() ? `?${params.toString()}` : ""}`);
}
