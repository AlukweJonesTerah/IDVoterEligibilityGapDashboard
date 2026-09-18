"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useFilters } from "./FilterContext";
import type { Year } from "@/lib/years";

const selectClass =
  "min-w-[120px] flex-1 rounded border border-hair bg-paperalt px-2 py-1.5 text-xs text-ink focus:border-icta-gray focus:outline-none xl:flex-none";

function SearchableSelect({
  label,
  placeholder = "All",
  options,
  value,
  onChange
}: {
  label: string;
  /** Shown on the closed trigger and as the clear-selection row when nothing
      is picked -- e.g. "All Counties" -- so the control names itself without
      a separate eyebrow label above it (matches the reference dashboard's
      plain, self-labeled dropdown row). */
  placeholder?: string;
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
        <span className="truncate">{value || placeholder}</span>
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
              {placeholder}
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

  // One flat row of self-labeled dropdowns (matches the reference
  // dashboard's filter strip) instead of a separate "Select age" row of
  // chips above a second row of controls.
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1 rounded border border-hair bg-paperalt p-0.5">
        {(["both", "male", "female"] as const).map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setFilters({ gender: g })}
            className={`rounded px-2.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              filters.gender === g ? "bg-icta-black text-white" : "text-subink hover:bg-paper"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <SearchableSelect
        label="Age band"
        placeholder="All Ages"
        options={meta.ageBands}
        value={filters.ageBand}
        onChange={(ageBand) => setFilters({ ageBand })}
      />

      {year === "2019" ? (
        <>
          <SearchableSelect
            label="County"
            placeholder="All Counties"
            options={meta.counties}
            value={filters.county}
            onChange={(county) => setFilters({ county, subCounty: null, division: null, location: null })}
          />
          <SearchableSelect
            label="Sub County"
            placeholder="All Sub-Counties"
            options={meta.subCounties}
            value={filters.subCounty}
            onChange={(subCounty) => setFilters({ subCounty })}
          />
        </>
      ) : (
        <>
          <SearchableSelect
            label="Province"
            placeholder="All Provinces"
            options={meta.provinces}
            value={filters.province}
            onChange={(province) => setFilters({ province, district: null, division: null, location: null })}
          />
          <SearchableSelect
            label="District"
            placeholder="All Districts"
            options={meta.districts}
            value={filters.district}
            onChange={(district) => setFilters({ district, division: null, location: null })}
          />
        </>
      )}

      {showAdminFilters ? (
        <>
          <SearchableSelect
            label="Division"
            placeholder="All Divisions"
            options={meta.divisions}
            value={filters.division}
            onChange={(division) => setFilters({ division, location: null })}
          />
          <SearchableSelect
            label="Location"
            placeholder="All Locations"
            options={meta.locations}
            value={filters.location}
            onChange={(location) => setFilters({ location })}
          />
        </>
      ) : null}

      <button
        onClick={clear}
        disabled={!active}
        className="rounded border border-hair bg-paper px-2.5 py-1.5 text-xs font-medium text-icta-blue hover:bg-icta-blueSoft disabled:cursor-not-allowed disabled:text-mute disabled:opacity-50 disabled:hover:bg-paper"
      >
        Reset filters
      </button>
    </div>
  );
}
