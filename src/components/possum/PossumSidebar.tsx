"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildDashboardHref } from "@/lib/dashboardContext";
import { useDashboardSessionState } from "@/components/possum/useDashboardSessionState";
import { getDashboardNavSections } from "@/lib/dashboard/navigation";

function itemClass(active: boolean): string {
  return active
    ? "block rounded-md border border-red-500/60 bg-red-900/20 px-3 py-2 text-sm font-extrabold uppercase tracking-[0.05em] text-red-200 possum-glow-soft"
    : "block rounded-md border border-transparent px-3 py-2 text-sm font-bold uppercase tracking-[0.04em] text-red-300/85 hover:border-red-500/40 hover:bg-red-950/40 hover:text-red-200";
}

function isItemActive(pathname: string | null, href: string) {
  const baseHref = href.split("?")[0].split("#")[0];
  return pathname === baseHref || pathname?.startsWith(`${baseHref}/`);
}

export default function PossumSidebar() {
  const pathname = usePathname();
  const { isMasterOwner } = useDashboardSessionState();
  const sections = getDashboardNavSections(isMasterOwner);

  return (
    <div className="rounded-xl border possum-divider bg-black/55 p-4 possum-border">
      <div className="mb-4 border-b possum-divider pb-3">
        <p className="text-[11px] uppercase tracking-[0.24em] possum-soft">Possum Bot</p>
        <Link
          href={buildDashboardHref("/dashboard")}
          className="mt-1 block text-lg font-black uppercase tracking-[0.08em] possum-red possum-glow-soft hover:text-red-200"
        >
          Dashboard
        </Link>
      </div>

      <nav className="space-y-4">
        {sections.map((section) => (
          <details
            key={section.label}
            className="rounded-lg border border-red-900/40 bg-black/25"
            defaultOpen={section.defaultOpen || section.items.some((item) => isItemActive(pathname, item.href))}
          >
            <summary className="cursor-pointer list-none px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-red-300/70">
              {section.label}
            </summary>
            <div className="space-y-1 px-2 pb-2">
              {section.items.map((item) => {
                const active = isItemActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={buildDashboardHref(item.href)}
                    className={itemClass(Boolean(active))}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </details>
        ))}
      </nav>
    </div>
  );
}
