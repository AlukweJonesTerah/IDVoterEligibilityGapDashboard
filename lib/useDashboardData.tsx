"use client";

import { useEffect, useState } from "react";
import { useFilters } from "@/components/dashboard/FilterContext";

export interface Widgets {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: { data: any; [extra: string]: any };
}

const clientCache = new Map<string, Widgets>();
const configuredRefreshMs = Number(process.env.NEXT_PUBLIC_DASHBOARD_REFRESH_MS ?? 10 * 60_000);
const browserRefreshMs = Number.isFinite(configuredRefreshMs) && configuredRefreshMs > 0
  ? configuredRefreshMs
  : 10 * 60_000;

export function useDashboardData(endpoint: string) {
  const { queryString } = useFilters();
  const url = queryString ? `${endpoint}${endpoint.includes("?") ? "&" : "?"}${queryString}` : endpoint;

  const [widgets, setWidgets] = useState<Widgets | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let requestInFlight = false;
    const cached = clientCache.get(url);
    if (cached) {
      setWidgets(cached);
      setError(null);
    } else {
      setWidgets(null);
    }
    const load = () => {
      if (requestInFlight) return;
      requestInFlight = true;
      fetch(url, { cache: "no-store" })
        .then((r) => {
          if (!r.ok) throw new Error(`${url} responded ${r.status}`);
          return r.json();
        })
        .then((json) => {
          if (!cancelled) {
            clientCache.set(url, json.widgets);
            setWidgets(json.widgets);
            setError(null);
          }
        })
        .catch((e) => {
          if (!cancelled) setError(String(e));
        })
        .finally(() => {
          requestInFlight = false;
        });
    };

    load();
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, browserRefreshMs);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [url]);

  return { widgets, error };
}

export function LoadingBlock({ error }: { error: string | null }) {
  return (
    <div className="rounded border border-hair bg-paperalt p-8 text-center text-sm text-mute shadow-card">
      {error ? `Failed to load: ${error}` : "Loading…"}
    </div>
  );
}
