"use client";

import { useEffect, useState } from "react";
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

export function FilterBar() {
  const { filters, setFilters, clear, active } = useFilters();
  const [meta, setMeta] = useState<{ counties: string[]; categories: string[] } | null>(null);

  useEffect(() => {
    fetch("/api/meta")
      .then((r) => r.json())
      .then(setMeta)
      .catch(() => setMeta({ counties: [], categories: [] }));
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2 py-2.5 xl:py-0">
      <span className="eyebrow mr-1 shrink-0">Filters</span>

      <select
        aria-label="County"
        className={selectClass}
        value={filters.county ?? ""}
        onChange={(e) => setFilters({ county: e.target.value || null })}
      >
        <option value="">All counties</option>
        {meta?.counties.map((c) => (
          <option key={c} value={c}>
            {c}
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
          className="rounded border border-hair bg-paper px-2 py-1.5 text-xs font-medium text-icta-redDeep hover:bg-icta-redSoft"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
