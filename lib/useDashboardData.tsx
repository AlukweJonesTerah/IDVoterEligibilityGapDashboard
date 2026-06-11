"use client";

import { useEffect, useState } from "react";
import type { Provenance } from "@/lib/provenance";

export interface Widgets {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: { data: any; provenance: Provenance };
}

export function useDashboardData(endpoint: string) {
  const [widgets, setWidgets] = useState<Widgets | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(endpoint)
      .then((r) => {
        if (!r.ok) throw new Error(`${endpoint} responded ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setWidgets(json.widgets);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  return { widgets, error };
}

export function LoadingBlock({ error }: { error: string | null }) {
  return (
    <div className="rounded border border-hair bg-paperalt p-8 text-center text-sm text-mute shadow-card">
      {error ? `Failed to load: ${error}` : "Loading…"}
    </div>
  );
}
