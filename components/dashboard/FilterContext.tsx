"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface FilterState {
  gender: "both" | "male" | "female";
  county: string | null;
  subCounty: string | null;
  division: string | null;
  location: string | null;
  province: string | null;
  district: string | null;
  ageBand: string | null;
}

const EMPTY: FilterState = {
  gender: "both",
  county: null,
  subCounty: null,
  division: null,
  location: null,
  province: null,
  district: null,
  ageBand: null
};
const STORAGE_KEY = "eligibility-filters-v1";

interface FilterContextValue {
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;
  clear: () => void;
  active: boolean;
  queryString: string;
}

const Ctx = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setState] = useState<FilterState>(EMPTY);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) setState({ ...EMPTY, ...JSON.parse(saved) });
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  const value = useMemo<FilterContextValue>(() => {
    const params = new URLSearchParams();
    if (filters.gender !== "both") params.set("fgender", filters.gender);
    if (filters.county) params.set("fcounty", filters.county);
    if (filters.subCounty) params.set("fsubcounty", filters.subCounty);
    if (filters.division) params.set("fdivision", filters.division);
    if (filters.location) params.set("flocation", filters.location);
    if (filters.province) params.set("fprovince", filters.province);
    if (filters.district) params.set("fdistrict", filters.district);
    if (filters.ageBand) params.set("fageband", filters.ageBand);
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
