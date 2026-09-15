"use client";

import { Fragment, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { useFilters } from "@/components/dashboard/FilterContext";
import { Widget } from "@/components/dashboard/Widget";
import { PivotTable } from "@/components/dashboard/PivotTable";
import { fmt } from "@/lib/format";
import type { Year } from "@/lib/years";

const GROUP_PAGE_SIZE = 10;

interface PivotRow2019 {
  name: string;
  county: string;
  population: number;
}
interface PivotRow2009 {
  name: string;
  population: number;
}
interface DetailRow2019 {
  name: string;
  county: string;
  subcounty: string;
  division: string;
  idHolders: number;
}
interface DetailRow2009 {
  name: string;
  province: string;
  idHolders: number;
}

/** County rows collapse to reveal their sub-county children -- matches the source report's expandable 2019 pivot. Filterable by county or child name, paginated by county group. 2009's geography is flatter (no sub-county level, see FlatPivot below). */
function GroupedPivot({ rows, countyLabel, rowLabel }: { rows: PivotRow2019[]; countyLabel: string; rowLabel: string }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const allGroups = useMemo(() => {
    const groups = new Map<string, PivotRow2019[]>();
    for (const r of rows) {
      if (!groups.has(r.county)) groups.set(r.county, []);
      groups.get(r.county)!.push(r);
    }
    return [...groups.entries()]
      .map(([county, items]) => ({ county, items, total: items.reduce((s, i) => s + i.population, 0) }))
      .sort((a, b) => b.total - a.total);
  }, [rows]);
  const grand = allGroups.reduce((s, g) => s + g.total, 0);
  const max = Math.max(1, ...allGroups.map((g) => g.total));

  const q = query.trim().toLowerCase();
  const groupRows = q
    ? allGroups
        .filter((g) => g.county.toLowerCase().includes(q) || g.items.some((i) => i.name.toLowerCase().includes(q)))
        .map((g) => (g.county.toLowerCase().includes(q) ? g : { ...g, items: g.items.filter((i) => i.name.toLowerCase().includes(q)) }))
    : allGroups;

  const pageCount = Math.max(1, Math.ceil(groupRows.length / GROUP_PAGE_SIZE));
  const clampedPage = Math.min(page, pageCount - 1);
  const pageGroups = groupRows.slice(clampedPage * GROUP_PAGE_SIZE, clampedPage * GROUP_PAGE_SIZE + GROUP_PAGE_SIZE);

  const toggle = (county: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(county)) next.delete(county);
      else next.add(county);
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      {allGroups.length > GROUP_PAGE_SIZE ? (
        <div className="flex items-center gap-1.5 self-start rounded border border-hair bg-paperalt px-2 py-1">
          <Search size={13} className="shrink-0 text-mute" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            placeholder={`Search ${countyLabel.toLowerCase()} or ${rowLabel.toLowerCase()}...`}
            className="w-52 bg-transparent text-xs text-ink outline-none"
          />
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-hair text-mute">
              <th className="py-1.5 pr-3 font-medium">{countyLabel}</th>
              <th className="py-1.5 pr-3 text-right font-medium">Adult population</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {pageGroups.map((g) => {
              const isOpen = open.has(g.county) || (q.length > 0 && g.items.length < (allGroups.find((a) => a.county === g.county)?.items.length ?? 0));
              return (
                <Fragment key={g.county}>
                  <tr className="cursor-pointer border-b border-hair hover:bg-paper" onClick={() => toggle(g.county)}>
                    <td className="py-1.5 pr-3 font-semibold text-ink">
                      <span className="mr-1.5 inline-block w-3 text-center text-mute">{isOpen ? "−" : "+"}</span>
                      {g.county}
                    </td>
                    <td className="py-1.5 pr-3 text-right font-semibold text-ink">
                      <div className="relative">
                        <div
                          className="absolute inset-y-0 right-0 -z-10 rounded-sm bg-icta-blueSoft"
                          style={{ width: `${Math.max(4, (100 * g.total) / max)}%` }}
                        />
                        <span className="relative pr-1">{fmt(g.total)}</span>
                      </div>
                    </td>
                  </tr>
                  {isOpen
                    ? g.items.map((item) => (
                        <tr key={item.name} className="border-b border-hair last:border-0">
                          <td className="py-1.5 pl-7 pr-3 text-subink">
                            {rowLabel}: {item.name}
                          </td>
                          <td className="py-1.5 pr-3 text-right text-subink">{fmt(item.population)}</td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
            {groupRows.length === 0 ? (
              <tr>
                <td colSpan={2} className="py-4 text-center text-mute">
                  {allGroups.length === 0 ? "No rows match the current filters." : <>No rows match &quot;{query}&quot;.</>}
                </td>
              </tr>
            ) : null}
            <tr className="border-t-2 border-hair font-semibold text-ink">
              <td className="py-1.5 pr-3">Total</td>
              <td className="py-1.5 pr-3 text-right">{fmt(grand)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-mute">
          <span>
            {groupRows.length} {countyLabel.toLowerCase()}
            {groupRows.length === 1 ? "" : "s"} &middot; page {clampedPage + 1} of {pageCount}
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

export function AdminDetailsPage({ year, threshold }: { year: Year; threshold: number }) {
  const { widgets, error } = useDashboardData(`/api/admin-details?year=${year}&threshold=${threshold}`);
  const { filters } = useFilters();

  if (!widgets) return <LoadingBlock error={error} />;

  const adultTotal = (widgets.adultPopulationPivot.data as { population: number }[]).reduce((s, r) => s + r.population, 0);
  // Server-computed, unlimited aggregate -- NOT a client-side sum of the
  // displayed rows, which are capped (2019: top 2000 of ~5,300 locations)
  // and would silently undercount this headline figure.
  const idHoldersTotal = widgets.registeredIdsTable.total as number;
  const gapTotal = Math.max(adultTotal - idHoldersTotal, 0);

  const crumb =
    year === "2019"
      ? [filters.county || "All Counties", filters.subCounty || "All SubCounties", "All Divisions", "All Locations"].join("  »  ")
      : null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hair pb-4">
        <h2 className="text-lg font-bold text-ink sm:text-xl">
          Adult ID Coverage Gap ({threshold}+ in year {year})
        </h2>
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:flex sm:flex-wrap sm:gap-6">
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(adultTotal)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Adult Population</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(idHoldersTotal)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Registered National IDs</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(gapTotal)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Population Without IDs</div>
          </div>
        </div>
      </div>

      <FilterBar year={year} />

      <p className="text-[11px] text-mute">
        Registered-ID detail below is a current, county-level snapshot with no per-threshold or gender split --
        only the {year === "2009" ? "province/district" : "county"} filter above narrows it.
      </p>

      {year === "2019" ? (
        <Widget
          title={`Adult population (${threshold}+) by county`}
          help={`Projected ${year} population aged ${threshold} and above, i.e. adults by 2026. Click a county to expand its sub-county breakdown.`}
        >
          <GroupedPivot rows={widgets.adultPopulationPivot.data as PivotRow2019[]} countyLabel="County" rowLabel="Sub-county" />
        </Widget>
      ) : (
        <Widget
          title={`Adult population (${threshold}+) by county`}
          help={`Projected ${year} population aged ${threshold} and above, i.e. adults by 2026, reconciled from 2009 districts to modern counties.`}
        >
          <PivotTable
            rowLabel="County"
            rows={widgets.adultPopulationPivot.data as PivotRow2009[]}
            totalRow={{ name: "Total", population: adultTotal }}
            columns={[{ key: "population", label: "Adult Population", align: "right", render: (r) => fmt(r.population), bar: (r) => r.population }]}
          />
        </Widget>
      )}

      <Widget title="Registered IDs By Administrative Units" help="Current national ID registry snapshot, no per-threshold or gender split. Use search to find a specific location.">
        {crumb ? <p className="mb-2 text-sm font-semibold text-subink">{crumb}</p> : null}
        <p className="mb-3 text-[11px] italic text-icta-red">To drill this further we need age at the ward level.</p>
        {year === "2019" ? (
          <PivotTable
            rowLabel="Location"
            rows={widgets.registeredIdsTable.data as DetailRow2019[]}
            totalRow={{ name: "Total", county: "", subcounty: "", division: "", idHolders: idHoldersTotal }}
            columns={[
              { key: "county", label: "County", render: (r) => r.county },
              { key: "subcounty", label: "Sub-county", render: (r) => r.subcounty },
              { key: "division", label: "Division", render: (r) => r.division },
              { key: "idHolders", label: "Registered National IDs", align: "right", render: (r) => fmt(r.idHolders), bar: (r) => r.idHolders }
            ]}
          />
        ) : (
          <PivotTable
            rowLabel="County"
            rows={widgets.registeredIdsTable.data as DetailRow2009[]}
            totalRow={{ name: "Total", province: "", idHolders: idHoldersTotal }}
            columns={[
              { key: "province", label: "Province", render: (r) => r.province },
              { key: "idHolders", label: "Registered National IDs", align: "right", render: (r) => fmt(r.idHolders), bar: (r) => r.idHolders }
            ]}
          />
        )}
      </Widget>
    </div>
  );
}
