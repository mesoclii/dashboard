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

const SESSION_CACHE_TTL_MS = 60_000;

let sessionCache:
  | {
      value: DashboardSessionState;
      expiresAt: number;
    }
  | null = null;
let sessionRequest: Promise<DashboardSessionState> | null = null;

async function loadDashboardSessionState(): Promise<DashboardSessionState> {
  const now = Date.now();
  if (sessionCache && sessionCache.expiresAt > now) {
    return sessionCache.value;
  }

  if (sessionRequest) {
    return sessionRequest;
  }

  sessionRequest = (async () => {
    let nextState: DashboardSessionState = {
      loading: false,
      loggedIn: false,
      isMasterOwner: false,
    };
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch("/api/auth/session?brief=1", {
        cache: "no-store",
        signal: controller.signal,
      });
      const json = await res.json().catch(() => ({}));
      nextState = {
        loading: false,
        loggedIn: Boolean(json?.loggedIn),
        isMasterOwner: Boolean(json?.isMasterOwner),
      };
    } catch {
      nextState = {
        loading: false,
        loggedIn: false,
        isMasterOwner: false,
      };
    } finally {
      window.clearTimeout(timeout);
    }

    sessionCache = {
      value: nextState,
      expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    };
    sessionRequest = null;
    return nextState;
  })();

  return sessionRequest;
}

export function useDashboardSessionState() {
  const [state, setState] = useState<DashboardSessionState>(DEFAULT_STATE);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const nextState = await loadDashboardSessionState();
      if (cancelled) return;
      setState(nextState);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
