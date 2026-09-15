"use client";

import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { useFilters } from "@/components/dashboard/FilterContext";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { ShapeMap } from "@/components/charts/ShapeMap";
import { DrillExplorer } from "@/components/dashboard/DrillExplorer";
import { PivotTable } from "@/components/dashboard/PivotTable";
import { rankedBarOption, statTreemapOption, genderColors, reportBlue } from "@/lib/charts/motion";
import { fmt, fmtCompact } from "@/lib/format";
import type { Year } from "@/lib/years";

interface AgeBandRow {
  name: string;
  value: number;
}
interface GenderRow {
  name: string;
  value: number;
}
interface CountyRow {
  name: string;
  value: number;
}
interface TopAdminRow {
  name: string;
  county: string;
  value: number;
}

export function OverviewPage({ year }: { year: Year }) {
  const { widgets, error } = useDashboardData(`/api/overview?year=${year}`);
  const { filters, setFilters } = useFilters();

  if (!widgets) return <LoadingBlock error={error} />;

  const headline = widgets.headline.data as {
    totalPopulation: number;
    adultPopulation2026: number;
    adultThreshold: number;
    idHolders: number;
    idGap: number;
    registeredVoters: number;
    voterGap: number;
    countyLevelOnly?: boolean;
  };
  const ageBand = widgets.populationByAgeBand.data as AgeBandRow[];
  const gender = widgets.genderSplit.data as GenderRow[];
  const countyMap = widgets.countyMap.data as CountyRow[];
  const topAdmin = widgets.topAdminUnits as { data: TopAdminRow[]; unitLabel: string; ageLabel: string; total: number };

  const contextLabel =
    year === "2019"
      ? filters.subCounty || filters.county || "All Counties"
      : filters.district || filters.province || "All Provinces";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hair pb-4">
        <h2 className="text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">{year} Population</h2>
        <div className="text-right">
          <div className="tnum text-2xl font-bold leading-8 text-ink sm:text-3xl">{fmt(headline.totalPopulation)}</div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-mute">Population</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Kpi
          label="Projected adults, 2026"
          value={fmtCompact(headline.adultPopulation2026)}
          sub={`Age ${headline.adultThreshold}+ in ${year}`}
          help={`Population aged ${headline.adultThreshold} or older in the ${year} census, projected forward to when they turn 18 by 2026.`}
        />
        <Kpi label="Current ID holders" value={fmtCompact(headline.idHolders)} sub={fmt(headline.idHolders)} />
        <Kpi
          label="ID gap"
          value={fmtCompact(headline.idGap)}
          sub="Projected adults without an ID"
          help="Projected 2026 adult population minus current ID holders, floored at zero."
        />
      </div>

      {/* Registered-voter figures live on their own page (Registered Voters),
          not duplicated here as KPIs -- see VotersComparisonPage. */}

      {headline.countyLevelOnly ? (
        <p className="text-[11px] text-mute">
          ID figures are a current, county-level snapshot with no historical district breakdown, so the
          province/district filter above does not narrow them.
        </p>
      ) : null}

      <FilterBar year={year} />

      <div className="rounded border border-hair bg-paperalt px-4 py-2.5 text-sm font-semibold text-ink shadow-card">
        {contextLabel}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Widget title="Population by age band" help="Click a bar to filter the whole page to that age band; click it again to clear.">
          <EChart
            option={rankedBarOption(
              ageBand.map((r) => r.name),
              ageBand.map((r) => r.value),
              reportBlue,
              { valueLabels: true }
            )}
            height={320}
            mobileHeight={240}
            onEvents={{
              click: (p: { name?: string }) => {
                if (!p.name) return;
                setFilters({ ageBand: filters.ageBand === p.name ? null : p.name });
              }
            }}
          />
        </Widget>

        <Widget title="Population by gender" help="Click a block to filter the whole page to that gender; click it again to clear.">
          <EChart
            option={statTreemapOption(gender, genderColors[year])}
            height={320}
            mobileHeight={220}
            onEvents={{
              click: (p: { name?: string }) => {
                if (!p.name) return;
                const clicked = p.name.toLowerCase() === "male" ? "male" : p.name.toLowerCase() === "female" ? "female" : null;
                if (!clicked) return;
                setFilters({ gender: filters.gender === clicked ? "both" : clicked });
              }
            }}
          />
        </Widget>
      </div>

      <Widget
        title="Regional population distribution (drill-through enabled)"
        help={`Click a ${year === "2019" ? "county" : "province"} node to expand its ${year === "2019" ? "sub-county" : "district"} breakdown.`}
      >
        <DrillExplorer year={year} />
      </Widget>

      <Widget
        title={`Geographic distribution of population by county${headline.countyLevelOnly ? " (reconciled from 2009 districts)" : ""}`}
        help={year === "2019" ? "Click a county to filter the whole page to it; click it again to clear." : undefined}
      >
        <ShapeMap
          data={countyMap}
          label="Population"
          height={440}
          mobileHeight={280}
          selectedName={year === "2019" ? filters.county : null}
          onRegionClick={
            year === "2019" ? (name) => setFilters({ county: filters.county === name ? null : name, subCounty: null }) : undefined
          }
        />
        <p className="mt-2 text-[11px] text-mute">Population by sub-county: low &rarr; high</p>
      </Widget>

      <Widget title={`Top ${topAdmin.unitLabel.toLowerCase()}s by ${topAdmin.ageLabel.toLowerCase()}`}>
        <PivotTable
          rowLabel={topAdmin.unitLabel}
          rows={topAdmin.data}
          totalRow={{ name: "Total", county: "", value: topAdmin.total }}
          columns={[
            { key: "county", label: "County / Province", render: (r) => r.county },
            { key: "value", label: topAdmin.ageLabel, align: "right", render: (r) => fmt(r.value), bar: (r) => r.value }
          ]}
        />
      </Widget>
    </div>
  );
}
