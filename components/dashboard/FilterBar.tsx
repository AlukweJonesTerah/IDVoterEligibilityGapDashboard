"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useFilters } from "./FilterContext";
import { labelCase } from "@/lib/format";

const PRESETS: { value: string; label: string }[] = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "quarter", label: "This quarter" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" }
];

const selectClass =
  "min-w-[120px] flex-1 rounded border border-hair bg-paperalt px-2 py-1.5 text-xs text-ink focus:border-icta-gray focus:outline-none xl:flex-none";

function CountyCombobox({
  counties,
  value,
  onChange
}: {
  counties: string[];
  value: string | null;
  onChange: (county: string | null) => void;
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

  const filtered = counties.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()));

  const select = (county: string | null) => {
    onChange(county);
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative min-w-[120px] flex-1 xl:flex-none">
      <button
        type="button"
        aria-label="County"
        className={`${selectClass} flex w-full items-center justify-between gap-2 text-left`}
        onClick={() => {
          setOpen((o) => !o);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
      >
        <span className="truncate">{value || "All counties"}</span>
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
              placeholder="Search counties..."
              className="w-full bg-transparent text-xs text-ink outline-none"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            <button
              type="button"
              onClick={() => select(null)}
              className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-icta-greenSoft ${!value ? "font-semibold text-icta-greenDeep" : "text-ink"}`}
            >
              All counties
            </button>
            {filtered.length ? (
              filtered.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => select(c)}
                  className={`block w-full px-3 py-1.5 text-left text-xs hover:bg-icta-greenSoft ${value === c ? "font-semibold text-icta-greenDeep" : "text-ink"}`}
                >
                  {c}
                </button>
              ))
            ) : (
              <p className="px-3 py-1.5 text-xs text-mute">No counties match.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FilterBar() {
  const { filters, setFilters, clear, active } = useFilters();
  const [meta, setMeta] = useState<{
    counties: string[];
    categories: string[];
    sources: string[];
    partners: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta({ counties: [], categories: [], sources: [], partners: [] }));
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5 xl:py-0">
      <CountyCombobox
        counties={meta?.counties ?? []}
        value={filters.county}
        onChange={(county) => setFilters({ county })}
      />

      <select
        aria-label="Training partner"
        className={selectClass}
        value={filters.partner ?? ""}
        onChange={(e) => setFilters({ partner: e.target.value || null })}
      >
        <option value="">All training partners</option>
        {meta?.partners.map((partner) => (
          <option key={partner} value={partner}>
            {partner}
          </option>
        ))}
      </select>

      <select
        aria-label="Source or programme stream"
        className={selectClass}
        value={filters.source ?? ""}
        onChange={(e) => setFilters({ source: e.target.value || null })}
      >
        <option value="">All sources / streams</option>
        {meta?.sources.map((source) => (
          <option key={source} value={source}>
            {source}
          </option>
        ))}
      </select>

      <select
        aria-label="Course category"
        className={selectClass}
        value={filters.category ?? ""}
        onChange={(e) => setFilters({ category: e.target.value || null })}
      >
        <option value="">All categories</option>
        {meta?.categories.map((c) => (
          <option key={c} value={c}>
            {labelCase(c)}
          </option>
        ))}
      </select>

      <select
        aria-label="Date range"
        className={selectClass}
        value={filters.preset}
        onChange={(e) => setFilters({ preset: e.target.value })}
      >
        {PRESETS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      {filters.preset === "custom" ? (
        <>
          <input
            type="date"
            aria-label="From date"
            className={selectClass}
            value={filters.from ?? ""}
            onChange={(e) => setFilters({ from: e.target.value || null })}
          />
          <span className="text-xs text-mute">to</span>
          <input
            type="date"
            aria-label="To date"
            className={selectClass}
            value={filters.to ?? ""}
            onChange={(e) => setFilters({ to: e.target.value || null })}
          />
        </>
      ) : null}

      {active ? (
        <button
          onClick={clear}
          className="rounded border border-hair bg-paper px-2 py-1.5 text-xs font-medium text-icta-greenDeep hover:bg-icta-greenSoft"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
