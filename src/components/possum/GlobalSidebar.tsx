"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildDashboardHref } from "@/lib/dashboardContext";
import { useDashboardSessionState } from "@/components/possum/useDashboardSessionState";
import { getDashboardNavSections } from "@/lib/dashboard/navigation";

function isItemActive(pathname: string | null, href: string) {
  const baseHref = href.split("?")[0].split("#")[0];
  return pathname === baseHref || pathname?.startsWith(`${baseHref}/`);
}

export default function GlobalSidebar() {
  const pathname = usePathname();
  const { isMasterOwner } = useDashboardSessionState();
  const sections = getDashboardNavSections(isMasterOwner);

  return (
    <aside className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-3 text-sm font-semibold text-white">Navigation</p>
      <nav className="space-y-4">
        {sections.map((section) => (
          <details
            key={section.label}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50"
            defaultOpen={section.defaultOpen || section.items.some((item) => isItemActive(pathname, item.href))}
          >
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
              {section.label}
            </summary>
            <div className="space-y-1 px-2 pb-2">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.href);
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
          </details>
        ))}
      </nav>
    </aside>
  );
}
