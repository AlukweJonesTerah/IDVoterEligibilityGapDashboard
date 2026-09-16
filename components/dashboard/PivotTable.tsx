"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

export interface PivotColumn<Row> {
  key: string;
  label: string;
  align?: "left" | "right";
  render: (row: Row) => string;
  /** Raw numeric value for a Power-BI-style inline data bar, scaled to this column's max across `rows`. */
  bar?: (row: Row) => number;
}

const PAGE_SIZE = 10;

/** Generic rows x columns table -- Power BI's pivotTable/tableEx visuals. Filterable by row name and paginated. */
export function PivotTable<Row extends { name: string }>({
  rowLabel,
  rows,
  columns,
  totalRow,
  pageSize = PAGE_SIZE
}: {
  rowLabel: string;
  rows: Row[];
  columns: PivotColumn<Row>[];
  /** Optional bold summary row rendered at the bottom, reusing the same column renderers -- always reflects the full unfiltered dataset. */
  totalRow?: Row;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const barMax: Record<string, number> = {};
  for (const c of columns) {
    if (c.bar) barMax[c.key] = Math.max(1, ...rows.map((r) => c.bar!(r)));
  }

  const filtered = useMemo(
    () => (query.trim() ? rows.filter((r) => r.name.toLowerCase().includes(query.trim().toLowerCase())) : rows),
    [rows, query]
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageRows = filtered.slice(clampedPage * pageSize, clampedPage * pageSize + pageSize);

  const cell = (row: Row, c: PivotColumn<Row>) =>
    c.bar ? (
      <div className="relative">
        <div
          className="absolute inset-y-0 right-0 -z-10 rounded-sm bg-icta-blueSoft"
          style={{ width: `${Math.max(4, (100 * c.bar(row)) / barMax[c.key])}%` }}
        />
        <span className="relative pr-1">{c.render(row)}</span>
      </div>
    ) : (
      c.render(row)
    );

  return (
    <div className="flex flex-col gap-2">
      {rows.length > pageSize ? (
        <div className="flex items-center gap-1.5 self-start rounded border border-hair bg-paperalt px-2 py-1">
          <Search size={13} className="shrink-0 text-mute" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={`Search ${rowLabel.toLowerCase()}...`}
            className="w-40 bg-transparent text-xs text-ink outline-none"
          />
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-hair text-mute">
              <th className="sticky left-0 z-10 border-r border-hair bg-paperalt py-1.5 pr-3 font-medium">{rowLabel}</th>
              {columns.map((c) => (
                <th key={c.key} className={`py-1.5 pr-3 font-medium ${c.align === "right" ? "text-right" : "text-left"}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tnum">
            {pageRows.map((row) => (
              <tr key={row.name} className="border-b border-hair last:border-0">
                <td className="sticky left-0 z-10 border-r border-hair bg-paperalt py-1.5 pr-3 text-ink">{row.name}</td>
                {columns.map((c) => (
                  <td key={c.key} className={`py-1.5 pr-3 text-subink ${c.align === "right" ? "text-right" : "text-left"}`}>
                    {cell(row, c)}
                  </td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="py-4 text-center text-mute">
                  {rows.length === 0 ? "No rows match the current filters." : <>No rows match &quot;{query}&quot;.</>}
                </td>
              </tr>
            ) : null}
            {totalRow ? (
              <tr className="border-t-2 border-hair font-semibold text-ink">
                <td className="sticky left-0 z-10 border-r border-hair bg-paperalt py-1.5 pr-3">{totalRow.name}</td>
                {columns.map((c) => (
                  <td key={c.key} className={`py-1.5 pr-3 ${c.align === "right" ? "text-right" : "text-left"}`}>
                    {c.render(totalRow)}
                  </td>
                ))}
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-mute">
          <span>
            {filtered.length} {rowLabel.toLowerCase()}
            {filtered.length === 1 ? "" : "s"} &middot; page {clampedPage + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={clampedPage === 0}
              onClick={() => setPage(clampedPage - 1)}
              className="rounded border border-hair bg-paperalt px-2 py-1 font-medium text-subink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={clampedPage >= pageCount - 1}
              onClick={() => setPage(clampedPage + 1)}
              className="rounded border border-hair bg-paperalt px-2 py-1 font-medium text-subink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
