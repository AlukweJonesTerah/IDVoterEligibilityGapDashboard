"use client";

import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { useFilters } from "@/components/dashboard/FilterContext";
import { Widget } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { ShapeMap } from "@/components/charts/ShapeMap";
import { DrillExplorer } from "@/components/dashboard/DrillExplorer";
import { rankedBarOption, statTreemapOption, genderColors, reportBlue } from "@/lib/charts/motion";
import { fmt } from "@/lib/format";
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

const CENSUS_BLURB: Record<Year, string> = {
  "2019":
    "The 2019 Kenya Population and Housing Census counted every person present in the country on census night, recording age, sex, and location for the whole population down to sub-county level.",
  "2009":
    "The 2009 Kenya Population and Housing Census counted every person present in the country on census night, recording age, sex, and location for the whole population down to district level."
};

export function OverviewPage({ year }: { year: Year }) {
  const { widgets, error } = useDashboardData(`/api/overview?year=${year}`);
  const { filters, setFilters } = useFilters();

  if (!widgets) return <LoadingBlock error={error} />;

  const headline = widgets.headline.data as {
    totalPopulation: number;
    countyLevelOnly?: boolean;
  };
  const ageBand = widgets.populationByAgeBand.data as AgeBandRow[];
  const gender = widgets.genderSplit.data as GenderRow[];
  const countyMap = widgets.countyMap.data as CountyRow[];

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

      <p className="text-sm text-subink">{CENSUS_BLURB[year]}</p>

      <FilterBar year={year} />

      <div className="rounded border border-hair bg-paperalt px-4 py-2.5 text-sm font-semibold text-ink shadow-card">
        {contextLabel}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
        title={`Geographic distribution of population by county${headline.countyLevelOnly ? " (reconciled from 2009 districts)" : ""}${year === "2019" && filters.county ? ` (${filters.county} selected)` : ""}`}
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
    </div>
  );
}
