"use client";

import { useEffect, useState } from "react";

type DashboardSessionState = {
  loading: boolean;
  loggedIn: boolean;
  isMasterOwner: boolean;
};

const DEFAULT_STATE: DashboardSessionState = {
  loading: true,
  loggedIn: false,
  isMasterOwner: false,
};

export function useDashboardSessionState() {
  const [state, setState] = useState<DashboardSessionState>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setState({
          loading: false,
          loggedIn: Boolean(json?.loggedIn),
          isMasterOwner: Boolean(json?.isMasterOwner),
        });
      } catch {
        if (cancelled) return;
        setState({
          loading: false,
          loggedIn: false,
          isMasterOwner: false,
        });
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
