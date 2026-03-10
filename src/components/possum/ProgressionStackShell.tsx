"use client";

import type { ReactNode } from "react";
import type { ProgressionStackKey } from "@/lib/dashboardEngineCatalog";

export default function ProgressionStackShell({
  activeKey,
  title,
  subtitle,
  children,
}: {
  activeKey: ProgressionStackKey;
  title: string;
  subtitle: string;
  children?: ReactNode;
}) {
  void activeKey;
  void title;
  void subtitle;
  return children ?? null;
}
