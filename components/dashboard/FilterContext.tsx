"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface FilterState {
  county: string | null;
  category: string | null;
  source: string | null;
  partner: string | null;
  preset: string; // 'all' | 'today' | '7d' | '30d' | 'month' | 'quarter' | 'year' | 'custom'
  from: string | null;
  to: string | null;
}

const EMPTY: FilterState = {
  county: null,
  category: null,
  source: null,
  partner: null,
  preset: "all",
  from: null,
  to: null
};
const STORAGE_KEY = "icta-filters-v2";
const LEGACY_STORAGE_KEY = "icta-filters";

interface FilterContextValue {
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;
  clear: () => void;
  active: boolean;
  queryString: string;
}

const Ctx = createContext<FilterContextValue | null>(null);

const iso = (d: Date) => d.toISOString().slice(0, 10);

export function presetRange(preset: string): { from: string | null; to: string | null } {
  const now = new Date();
  const today = iso(now);
  const daysAgo = (n: number) => iso(new Date(now.getTime() - n * 86400_000));
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7d":
      return { from: daysAgo(6), to: today };
    case "30d":
      return { from: daysAgo(29), to: today };
    case "month":
      return { from: iso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case "quarter": {
      const q = Math.floor(now.getMonth() / 3) * 3;
      return { from: iso(new Date(now.getFullYear(), q, 1)), to: today };
    }
    case "year":
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: today };
    default:
      return { from: null, to: null };
  }
}

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setState] = useState<FilterState>(EMPTY);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setState({ ...EMPTY, ...JSON.parse(saved) });
        return;
      }

      // Before partner became its own database field, the partner filter was
      // backed by source. Preserve that selection under its correct meaning.
      const legacy = sessionStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const parsed = JSON.parse(legacy) as Partial<FilterState>;
        setState({ ...EMPTY, ...parsed, source: parsed.partner ?? null, partner: null });
      }
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const value = useMemo<FilterContextValue>(() => {
    const dates = filters.preset === "custom" ? { from: filters.from, to: filters.to } : presetRange(filters.preset);
    const params = new URLSearchParams();
    if (filters.county) params.set("fcounty", filters.county);
    if (filters.category) params.set("fcategory", filters.category);
    if (filters.source) params.set("fsource", filters.source);
    if (filters.partner) params.set("fpartner", filters.partner);
    if (dates.from) params.set("ffrom", dates.from);
    if (dates.to) params.set("fto", dates.to);
    const queryString = params.toString();
    const persist = (next: FilterState) => {
      setState(next);
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
    };
    return {
      filters,
      queryString,
      active: queryString.length > 0,
      setFilters: (f) => persist({ ...filters, ...f }),
      clear: () => persist(EMPTY)
    };
  }, [filters]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
}
