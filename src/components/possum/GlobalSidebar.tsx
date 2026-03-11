"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildDashboardHref } from "@/lib/dashboardContext";

type Section = {
  label: string;
  items: Array<{ href: string; label: string }>;
};

const SECTIONS: Section[] = [
  {
    label: "Guild Control",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/bot-personalizer", label: "Bot Personalizer" },
      { href: "/dashboard/premium-features", label: "Premium Features" },
    ],
  },
  {
    label: "AI + Automation",
    items: [
      { href: "/dashboard/ai/learning", label: "Possum AI" },
      { href: "/dashboard/ai/persona", label: "Persona AI" },
      { href: "/dashboard/slash-commands", label: "Slash Commands" },
      { href: "/dashboard/commands", label: "!Command Studio" },
      { href: "/dashboard/automations/studio", label: "Automation Studio" },
    ],
  },
  {
    label: "Security + Community",
    items: [
      { href: "/dashboard/security", label: "Security" },
      { href: "/dashboard/moderator", label: "Moderator" },
      { href: "/dashboard/tickets", label: "Tickets" },
      { href: "/dashboard/selfroles", label: "Selfroles" },
      { href: "/dashboard/invite-tracker", label: "Invite Tracker" },
      { href: "/dashboard/tts", label: "TTS" },
      { href: "/dashboard/vip", label: "VIP" },
    ],
  },
  {
    label: "Economy",
    items: [
      { href: "/dashboard/economy", label: "Economy" },
      { href: "/dashboard/economy/store", label: "Store" },
      { href: "/dashboard/economy/progression", label: "Progression" },
      { href: "/dashboard/giveaways", label: "Giveaways" },
    ],
  },
  {
    label: "Fun + Games",
    items: [
      { href: "/dashboard/music", label: "Music" },
      { href: "/dashboard/jed", label: "Jed" },
      { href: "/dashboard/heist", label: "Heist" },
      { href: "/dashboard/gta-ops", label: "GTA Ops" },
      { href: "/dashboard/games", label: "Games" },
      { href: "/dashboard/pokemon-catching", label: "Pokemon Catching" },
      { href: "/dashboard/pokemon-battle", label: "Pokemon Battle" },
      { href: "/dashboard/pokemon-trade", label: "Pokemon Trade" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/dashboard/panels", label: "Panel Hub" },
      { href: "/dashboard/system-health", label: "System Health" },
    ],
  },
];

export default function GlobalSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-3 text-sm font-semibold text-white">Navigation</p>
      <nav className="space-y-4">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="mb-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">{section.label}</div>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={buildDashboardHref(item.href)}
                    className={
                      active
                        ? "block rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
                        : "block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
