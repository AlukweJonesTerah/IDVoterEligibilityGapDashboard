"use client";

import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { useFilters } from "@/components/dashboard/FilterContext";
import { Widget } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { ShapeMap } from "@/components/charts/ShapeMap";
import { PivotTable } from "@/components/dashboard/PivotTable";
import { rankedBarOption, reportBlue } from "@/lib/charts/motion";
import { fmt } from "@/lib/format";
import type { Year } from "@/lib/years";

interface GapRow {
  name: string;
  adults: number;
  idHolders: number;
  gap: number;
}

export function EligibilityPage({ year, threshold }: { year: Year; threshold: number }) {
  const { widgets, error } = useDashboardData(`/api/eligibility?year=${year}&threshold=${threshold}`);
  const { filters, setFilters } = useFilters();

  if (!widgets) return <LoadingBlock error={error} />;

  // Ranked by population, not sequential by age -- matches the source
  // report, and surfaces age-heaping (census respondents rounding their
  // stated age) that a sequential axis would bury. Filtered to this page's
  // own threshold and up: below-threshold ages aren't part of the adult
  // cohort this page is about, so they shouldn't appear (e.g. no age 10 on
  // the 11+ page).
  const byAge = [...(widgets.ageSpecificDistribution.data as { age: number; value: number }[])]
    .filter((r) => r.age >= threshold)
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
  const byBand = widgets.eligibleAdultsByAgeGroup.data as { name: string; value: number }[];
  const gapMap = widgets.idGapMap.data as { name: string; value: number }[];
  const gapRows = widgets.idGapPivot.data as GapRow[];

  const totals = gapRows.reduce(
    (acc, r) => ({ adults: acc.adults + r.adults, idHolders: acc.idHolders + r.idHolders, gap: acc.gap + r.gap }),
    { adults: 0, idHolders: 0, gap: 0 }
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hair pb-4">
        <h2 className="text-lg font-bold text-ink sm:text-xl">
          Adult ID Coverage Gap ({threshold}+ in {year}, 18+ by 2026)
        </h2>
        <div className="grid w-full grid-cols-3 gap-3 sm:w-auto sm:flex sm:flex-wrap sm:gap-6">
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.adults)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Adult Population</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.idHolders)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Registered National IDs</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.gap)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Population Without IDs</div>
          </div>
        </div>
      </div>

      <FilterBar year={year} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Widget
          title="Age-specific population distribution"
          help={`Bars from age ${threshold} onward (shaded) are the population projected to be adults by 2026.`}
        >
          <EChart
            option={rankedBarOption(
              byAge.map((r) => String(r.age)),
              byAge.map((r) => r.value),
              reportBlue,
              { valueLabels: true }
            )}
            height={300}
            mobileHeight={380}
          />
        </Widget>

        <Widget title="Eligible adult population by age group" help="Click a bar to filter the whole page to that age band; click it again to clear.">
          <EChart
            option={rankedBarOption(
              byBand.map((r) => r.name),
              byBand.map((r) => r.value),
              reportBlue,
              { valueLabels: true }
            )}
            height={300}
            mobileHeight={260}
            onEvents={{
              click: (p: { name?: string }) => {
                if (!p.name) return;
                setFilters({ ageBand: filters.ageBand === p.name ? null : p.name });
              }
            }}
          />
        </Widget>
      </div>

      <Widget
        title={`Adult population without IDs, by county${year === "2019" && filters.county ? ` (${filters.county} selected)` : ""}`}
        help="Click a county to filter the whole page to it; click it again to clear. ID-holder coverage in the source registry varies sharply by county -- some urban/informal-settlement areas (e.g. parts of Nairobi) show very low counts, which likely reflects incomplete administrative records for those locations rather than genuinely near-zero ID possession. Read large gaps in low-coverage counties with that caveat."
      >
        <ShapeMap
          data={gapMap}
          label="Population without an ID"
          height={440}
          mobileHeight={280}
          selectedName={year === "2019" ? filters.county : null}
          onRegionClick={
            year === "2019" ? (name) => setFilters({ county: filters.county === name ? null : name, subCounty: null }) : undefined
          }
        />
        <p className="mt-2 text-[11px] text-mute">Population without IDs: low &rarr; high</p>
      </Widget>

      <Widget title="Adult ID gap" help="Projected adult population (this threshold) minus current ID holders, by county. Counties with sparse source coverage will show inflated gaps -- see the map caption above.">
        <PivotTable
          rowLabel="County"
          rows={gapRows}
          totalRow={{ name: "Total", ...totals }}
          columns={[
            { key: "adults", label: "Adult Population", align: "right", render: (r) => fmt(r.adults) },
            { key: "idHolders", label: "Registered National IDs", align: "right", render: (r) => fmt(r.idHolders) },
            { key: "gap", label: "Population Without IDs", align: "right", render: (r) => fmt(r.gap), bar: (r) => r.gap }
          ]}
        />
      </Widget>
    </div>
  );
}
