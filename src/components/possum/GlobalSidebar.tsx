"use client";

import { useMemo, useState } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildDashboardHref } from "@/lib/dashboardContext";
import { useDashboardSessionState } from "@/components/possum/useDashboardSessionState";
import { getDashboardNavSections, getDashboardNavTopLinks } from "@/lib/dashboard/navigation";

function isItemActive(pathname: string | null, href: string) {
  const baseHref = href.split("?")[0].split("#")[0];
  return pathname === baseHref || pathname?.startsWith(`${baseHref}/`);
}

function handleDashboardNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
  event.preventDefault();
  event.stopPropagation();
  if (typeof window === "undefined") return;
  window.location.assign(buildDashboardHref(href));
}

export default function GlobalSidebar() {
  const pathname = usePathname();
  const { isMasterOwner } = useDashboardSessionState();
  const topLinks = useMemo(() => getDashboardNavTopLinks(isMasterOwner), [isMasterOwner]);
  const sections = useMemo(() => getDashboardNavSections(isMasterOwner), [isMasterOwner]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  function isSectionOpen(label: string, defaultOpen: boolean) {
    return typeof openSections[label] === "boolean" ? openSections[label] : defaultOpen;
  }

  function toggleSection(label: string, defaultOpen: boolean) {
    setOpenSections((prev) => ({ ...prev, [label]: !isSectionOpen(label, defaultOpen) }));
  }

  return (
    <aside className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="mb-3 text-sm font-semibold text-white">Navigation</p>
      <div className="mb-4 space-y-1">
        <Link
          href={buildDashboardHref("/dashboard")}
          className={
            isItemActive(pathname, "/dashboard")
              ? "block rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
              : "block rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
          }
        >
          Dashboard
        </Link>
        {topLinks.map((item) => {
          const active = isItemActive(pathname, item.href);
          return (
            <a
              key={item.href}
              href={buildDashboardHref(item.href)}
              onClick={(event) => handleDashboardNavClick(event, item.href)}
              className={
                active
                  ? "relative z-10 block cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
                  : "relative z-10 block cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
              }
            >
              {item.label}
            </a>
          );
        })}
      </div>
      <nav className="space-y-4">
        {sections.map((section) => {
          const defaultOpen = Boolean(section.defaultOpen || section.items.some((item) => isItemActive(pathname, item.href)));
          const open = isSectionOpen(section.label, defaultOpen);
          return (
            <div key={section.label} className="rounded-lg border border-zinc-800 bg-zinc-900/50">
              <button
                type="button"
                onClick={() => toggleSection(section.label, defaultOpen)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400"
              >
                {section.label}
                <span>{open ? "-" : "+"}</span>
              </button>
              {open ? (
                <div className="relative z-10 space-y-1 px-2 pb-2">
                  {section.items.map((item) => {
                    const active = isItemActive(pathname, item.href);
                    return (
                      <a
                        key={item.href}
                        href={buildDashboardHref(item.href)}
                        onClick={(event) => handleDashboardNavClick(event, item.href)}
                        className={
                          active
                            ? "relative z-10 block cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-white"
                            : "relative z-10 block cursor-pointer rounded-md px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900 hover:text-white"
                        }
                      >
                        {item.label}
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
