"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fmt } from "@/lib/format";
import type { Year } from "@/lib/years";

const ROOT_LABEL = "Adult Population";

// county -> subcounty -> division -> location, all from the ID registry's
// own admin-unit taxonomy (analytics.id_eligibility), same as the
// Registered IDs table and Division/Location filters above it.
const LEVELS = ["county", "subcounty", "division", "location"];

// Same fixed Power-BI-decomposition-tree geometry as DrillExplorer (see
// that file for the full rationale) -- kept in sync by eye since the two
// components serve visually identical widgets on different data.
const WINDOW = 3;
const ROW_H = 44;
const ROW_GAP = 8;
const COL_W = 190;
const COL_GAP = 56;
const ROOT_W = 170;
const CHEVRON_H = 18;
const CHEVRON_GAP = 4;
const CONTENT_H = WINDOW * ROW_H + (WINDOW - 1) * ROW_GAP;
const COLUMN_H = CHEVRON_H + CHEVRON_GAP + CONTENT_H + CHEVRON_GAP + CHEVRON_H;
const ROOT_CENTER_Y = CHEVRON_H + CHEVRON_GAP + CONTENT_H / 2;

interface Row {
  name: string;
  value: number;
}
interface ColumnState {
  parent: string;
  items: Row[];
  windowStart: number;
  activeIndex: number | null;
}

function rowCenterY(indexInWindow: number) {
  return CHEVRON_H + CHEVRON_GAP + indexInWindow * (ROW_H + ROW_GAP) + ROW_H / 2;
}

function Bar({ row, max, active, expandable, onClick }: { row: Row; max: number; active: boolean; expandable: boolean; onClick: () => void }) {
  const pct = Math.max(4, Math.min(100, (100 * row.value) / max));
  return (
    <button
      type="button"
      onClick={expandable ? onClick : undefined}
      style={{ height: ROW_H }}
      className={`relative block w-full shrink-0 overflow-hidden rounded-sm border text-left transition-colors ${
        active ? "border-ink" : "border-transparent"
      } ${expandable ? "cursor-pointer hover:border-icta-blue" : "cursor-default"}`}
    >
      <div className="absolute inset-0 bg-hair2" />
      <div className="absolute inset-y-0 left-0 bg-icta-blue" style={{ width: `${pct}%` }} />
      <div className="relative flex h-full flex-col justify-center gap-0.5 px-2">
        <span className={`truncate text-[11px] leading-tight text-ink ${active ? "font-bold" : "font-semibold"}`}>{row.name}</span>
        <span className="tnum truncate text-[10px] leading-tight text-subink">{fmt(row.value)}</span>
      </div>
    </button>
  );
}

function ChevronButton({ dir, disabled, onClick }: { dir: "up" | "down"; disabled: boolean; onClick: () => void }) {
  const Icon = dir === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{ height: CHEVRON_H }}
      className="flex w-full shrink-0 items-center justify-center text-icta-blue disabled:cursor-not-allowed disabled:text-hair"
      aria-label={`Scroll ${dir}`}
    >
      <Icon size={15} />
    </button>
  );
}

/**
 * Admin Details' "Adult Population" decomposition tree: county -> subcounty
 * -> division -> location, each node a real aggregate of its own children
 * (fetched with the FULL ancestor path, not just the immediate parent --
 * division/location names repeat across unrelated counties, e.g. many
 * counties have a "CENTRAL" division, so filtering by just the clicked
 * name would silently mix rows from the wrong county together). This is
 * the same visual pattern as DrillExplorer (Overview page); kept as a
 * separate component since the two fetch different levels/endpoints and
 * DrillExplorer's parent-only fetch is fine for its own 2-3 level, mostly-
 * unique-named geography.
 */
export function AdminDrillTree({ year, threshold }: { year: Year; threshold: number }) {
  const [rootTotal, setRootTotal] = useState<number | null>(null);
  const [columns, setColumns] = useState<ColumnState[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRootTotal(null);
    setColumns([]);
    setError(null);
    fetch(`/api/admin-drill?year=${year}&threshold=${threshold}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(`/api/admin-drill responded ${r.status}`);
        return r.json();
      })
      .then((json: { data: Row[] }) => {
        setRootTotal(json.data.reduce((s, r) => s + r.value, 0));
        setColumns([{ parent: "", items: json.data, windowStart: 0, activeIndex: null }]);
      })
      .catch((e) => setError(String(e)));
  }, [year, threshold]);

  if (error) return <div className="p-4 text-sm text-mute">Failed to load: {error}</div>;
  if (rootTotal === null) return <div className="p-4 text-sm text-mute">Loading...</div>;

  const selectRow = (colIdx: number, absoluteIndex: number) => {
    const row = columns[colIdx].items[absoluteIndex];
    const nextLevel = LEVELS[colIdx + 1];
    if (!row || !nextLevel) return;

    setColumns((prev) => prev.slice(0, colIdx + 1).map((c, i) => (i === colIdx ? { ...c, activeIndex: absoluteIndex } : c)));

    // Full ancestor path (not just this one parent): columns[1..colIdx]'s
    // selected names correspond to LEVELS[0..colIdx-1], plus this row's own
    // name for LEVELS[colIdx].
    const path = [...columns.slice(1, colIdx + 1).map((c) => c.parent), row.name];
    const params = new URLSearchParams({ year, threshold: String(threshold), level: nextLevel });
    path.forEach((name, i) => params.set(LEVELS[i], name));

    fetch(`/api/admin-drill?${params.toString()}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { data: Row[] }) => {
        setColumns((prev) => [...prev.slice(0, colIdx + 1), { parent: row.name, items: json.data, windowStart: 0, activeIndex: null }]);
      });
  };

  const page = (colIdx: number, dir: 1 | -1) => {
    setColumns((prev) =>
      prev.map((c, i) =>
        i === colIdx ? { ...c, windowStart: Math.max(0, Math.min(c.items.length - WINDOW, c.windowStart + dir * WINDOW)) } : c
      )
    );
  };

  const totalWidth = ROOT_W + COL_GAP + columns.length * COL_W + (columns.length - 1) * COL_GAP;

  const curves: { x1: number; y1: number; x2: number; y2: number; strong: boolean }[] = [];
  let xCursor = ROOT_W;
  columns.forEach((col, i) => {
    const colX = xCursor + COL_GAP;
    const visible = col.items.slice(col.windowStart, col.windowStart + WINDOW);
    let parentX: number | null = null;
    let parentY: number | null = null;
    if (i === 0) {
      parentX = ROOT_W;
      parentY = ROOT_CENTER_Y;
    } else {
      const prev = columns[i - 1];
      if (prev.activeIndex !== null && prev.activeIndex >= prev.windowStart && prev.activeIndex < prev.windowStart + WINDOW) {
        parentX = xCursor;
        parentY = rowCenterY(prev.activeIndex - prev.windowStart);
      }
    }
    if (parentX !== null && parentY !== null) {
      visible.forEach((_, idx) => {
        curves.push({ x1: parentX!, y1: parentY!, x2: colX, y2: rowCenterY(idx), strong: col.windowStart + idx === col.activeIndex });
      });
    }
    xCursor = colX + COL_W;
  });

  return (
    <div className="overflow-x-auto">
      <div className="relative" style={{ width: totalWidth, height: COLUMN_H }}>
        <svg className="pointer-events-none absolute inset-0" width={totalWidth} height={COLUMN_H}>
          {curves.map((c, i) => (
            <path
              key={i}
              d={`M ${c.x1} ${c.y1} C ${(c.x1 + c.x2) / 2} ${c.y1}, ${(c.x1 + c.x2) / 2} ${c.y2}, ${c.x2} ${c.y2}`}
              fill="none"
              stroke={c.strong ? "#0E1722" : "#C9D0DA"}
              strokeWidth={c.strong ? 1.75 : 1.25}
            />
          ))}
        </svg>

        <div
          className="absolute flex flex-col items-center justify-center"
          style={{ left: 0, top: 0, width: ROOT_W, height: COLUMN_H }}
        >
          <div style={{ height: ROW_H }} className="relative block w-full overflow-hidden rounded-sm border border-transparent">
            <div className="absolute inset-0 bg-icta-blue" />
            <div className="relative flex h-full flex-col justify-center gap-0.5 px-2">
              <span className="truncate text-[11px] font-bold leading-tight text-white">{ROOT_LABEL}</span>
              <span className="tnum truncate text-[10px] leading-tight text-white/85">{fmt(rootTotal)}</span>
            </div>
          </div>
        </div>

        {columns.map((col, i) => {
          const left = ROOT_W + COL_GAP + i * (COL_W + COL_GAP);
          const visible = col.items.slice(col.windowStart, col.windowStart + WINDOW);
          const colMax = Math.max(1, ...col.items.map((r) => r.value));
          return (
            <div key={i} className="absolute flex flex-col" style={{ left, top: 0, width: COL_W, height: COLUMN_H }}>
              <ChevronButton dir="up" disabled={col.windowStart === 0} onClick={() => page(i, -1)} />
              <div className="flex flex-col" style={{ gap: ROW_GAP, marginTop: CHEVRON_GAP }}>
                {visible.map((row, idx) => (
                  <Bar
                    key={row.name}
                    row={row}
                    max={colMax}
                    active={col.windowStart + idx === col.activeIndex}
                    expandable={!!LEVELS[i + 1]}
                    onClick={() => selectRow(i, col.windowStart + idx)}
                  />
                ))}
              </div>
              <ChevronButton
                dir="down"
                disabled={col.windowStart + WINDOW >= col.items.length}
                onClick={() => page(i, 1)}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-[11px] text-mute">
        Click a node to expand its {LEVELS.slice(1).join(" → ")} breakdown. Estimated adults ({">"}={" "}
        the selected threshold), apportioned the same way as the table below. Use the arrows to scroll through more
        branches.
      </p>
    </div>
  );
}
