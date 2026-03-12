"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { buildDashboardHref } from "@/lib/dashboardContext";

export default function PanelsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(buildDashboardHref("/dashboard"));
  }, [router]);

  return <div style={{ color: "#ffb3b3", padding: 16 }}>Master Panels was removed. Redirecting back to the dashboard...</div>;
}
