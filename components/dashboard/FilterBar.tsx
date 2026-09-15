"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useFilters } from "./FilterContext";
import type { Year } from "@/lib/years";

const selectClass =
  "min-w-[120px] flex-1 rounded border border-hair bg-paperalt px-2 py-1.5 text-xs text-ink focus:border-icta-gray focus:outline-none xl:flex-none";

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      {children}
    </div>
  );
}

function SearchableSelect({
  label,
  options,
  value,
  onChange
}: {
  label: string;
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const filtered = options.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()));

  const select = (v: string | null) => {
    onChange(v);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-[130px] flex-1 xl:flex-none">
      <button
        type="button"
        aria-label={label}
        className={`${selectClass} flex w-full items-center justify-between gap-2 text-left`}
        onClick={() => {
          setOpen((o) => !o);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <span className="truncate">{value || "All"}</span>
        <ChevronDown size={13} className="shrink-0 text-mute" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded border border-hair bg-paperalt shadow-lg">
          <div className="flex items-center gap-1.5 border-b border-hair px-2 py-1.5">
            <Search size={13} className="shrink-0 text-mute" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="w-full bg-transparent text-xs text-ink outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select(null)}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-icta-blueSoft ${!value ? "font-semibold text-icta-blue" : "text-ink"}`}
            >
              All
            </button>
            {filtered.length ? (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => select(c)}
                  className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-icta-blueSoft ${value === c ? "font-semibold text-icta-blue" : "text-ink"}`}
                >
                  {c}
                </button>
              ))
            ) : (
              <p className="px-3 py-1.5 text-xs text-mute">No matches.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** Horizontal scrollable quick-filter chip strip for Custom_Age_Band. */
function AgeBandChips({ options, value, onChange }: { options: string[]; value: string | null; onChange: (v: string | null) => void }) {
  // Natural width + shrink-0, not flex-1/basis-0: equal-width flex children
  // shrink to fit the row instead of ever triggering overflow-x-auto below,
  // which on a narrow phone squeezed labels like "11-20" or "All ages" down
  // to ~30px and wrapped them across two jagged lines. Fixed-content-width
  // chips let the row actually scroll horizontally on mobile instead.
  const chip = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded px-2.5 py-1 text-center text-xs font-medium transition-colors ${
      active ? "bg-icta-black text-white" : "border border-hair bg-paperalt text-subink hover:bg-paper"
    }`;
  return (
    <div className="flex w-full items-center gap-1 overflow-x-auto pb-0.5">
      <button type="button" onClick={() => onChange(null)} className={chip(!value)}>
        All ages
      </button>
      {options.map((band) => (
        <button key={band} type="button" onClick={() => onChange(band)} className={chip(value === band)}>
          {band}
        </button>
      ))}
    </div>
  );
}

interface Meta2019 {
  counties: string[];
  subCounties: string[];
}
interface Meta2009 {
  provinces: string[];
  districts: string[];
}
interface MetaAdmin {
  divisions: string[];
  locations: string[];
}
interface MetaShared {
  ageBands: string[];
}

const EMPTY_META: Meta2019 & Meta2009 & MetaAdmin & MetaShared = {
  counties: [],
  subCounties: [],
  provinces: [],
  districts: [],
  divisions: [],
  locations: [],
  ageBands: []
};

/**
 * Division/location narrow the ID-registry tables on the Admin Details
 * pages (analytics.id_eligibility) -- a different, current-day admin-unit
 * taxonomy from the census county/sub-county filters above, which is why
 * they only show up there (`showAdminFilters`) rather than on every page.
 */
export function FilterBar({ year, showAdminFilters = false }: { year: Year; showAdminFilters?: boolean }) {
  const { filters, setFilters, clear, active } = useFilters();
  const [meta, setMeta] = useState(EMPTY_META);

  useEffect(() => {
    const params = new URLSearchParams({ year });
    if (year === "2019" && filters.county) params.set("county", filters.county);
    if (year === "2009" && filters.province) params.set("province", filters.province);
    if (year === "2009" && filters.district) params.set("district", filters.district);
    if (filters.division) params.set("division", filters.division);
    fetch(`/api/meta?${params.toString()}`)
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta(EMPTY_META));
  }, [year, filters.county, filters.province, filters.district, filters.division]);

  return (
    <div className="flex flex-col gap-2.5">
      <FilterField label="Select age">
        <AgeBandChips options={meta.ageBands} value={filters.ageBand} onChange={(ageBand) => setFilters({ ageBand })} />
      </FilterField>

      <div className="flex flex-wrap items-end gap-2">
        <FilterField label="Gender">
          <div className="flex items-center gap-1 rounded border border-hair bg-paperalt p-0.5">
            {(["both", "male", "female"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setFilters({ gender: g })}
                className={`rounded px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                  filters.gender === g ? "bg-icta-black text-white" : "text-subink hover:bg-paper"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </FilterField>

        {year === "2019" ? (
          <>
            <FilterField label="Select county">
              <SearchableSelect
                label="County"
                options={meta.counties}
                value={filters.county}
                onChange={(county) => setFilters({ county, subCounty: null, division: null, location: null })}
              />
            </FilterField>
            <FilterField label="Select sub county">
              <SearchableSelect
                label="Sub County"
                options={meta.subCounties}
                value={filters.subCounty}
                onChange={(subCounty) => setFilters({ subCounty })}
              />
            </FilterField>
          </>
        ) : (
          <>
            <FilterField label="Select province">
              <SearchableSelect
                label="Province"
                options={meta.provinces}
                value={filters.province}
                onChange={(province) => setFilters({ province, district: null, division: null, location: null })}
              />
            </FilterField>
            <FilterField label="Select district">
              <SearchableSelect
                label="District"
                options={meta.districts}
                value={filters.district}
                onChange={(district) => setFilters({ district, division: null, location: null })}
              />
            </FilterField>
          </>
        )}

        {showAdminFilters ? (
          <>
            <FilterField label="Select division">
              <SearchableSelect
                label="Division"
                options={meta.divisions}
                value={filters.division}
                onChange={(division) => setFilters({ division, location: null })}
              />
            </FilterField>
            <FilterField label="Select location">
              <SearchableSelect
                label="Location"
                options={meta.locations}
                value={filters.location}
                onChange={(location) => setFilters({ location })}
              />
            </FilterField>
          </>
        ) : null}

        <button
          onClick={clear}
          disabled={!active}
          className="rounded border border-hair bg-paper px-2 py-1.5 text-xs font-medium text-icta-blue hover:bg-icta-blueSoft disabled:cursor-not-allowed disabled:text-mute disabled:opacity-50 disabled:hover:bg-paper"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
}
