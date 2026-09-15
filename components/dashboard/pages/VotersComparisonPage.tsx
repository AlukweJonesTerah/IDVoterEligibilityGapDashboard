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
  registeredVoters: number;
  gap: number;
  voterGap: number;
}

export function VotersComparisonPage({ year }: { year: Year }) {
  const { widgets, error } = useDashboardData(`/api/voters-comparison?year=${year}`);
  const { filters, setFilters } = useFilters();

  if (!widgets) return <LoadingBlock error={error} />;

  const byAge = [...(widgets.ageSpecificDistribution.data as { age: number; value: number }[])]
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);
  const byBand = widgets.eligibleAdultsByAgeGroup.data as { name: string; value: number }[];
  const voterGapMap = widgets.nonRegisteredVotersMap.data as { name: string; value: number }[];
  const gapRows = widgets.idGapPivot.data as GapRow[];

  const totals = gapRows.reduce(
    (acc, r) => ({
      adults: acc.adults + r.adults,
      idHolders: acc.idHolders + r.idHolders,
      registeredVoters: acc.registeredVoters + r.registeredVoters,
      gap: acc.gap + r.gap,
      voterGap: acc.voterGap + r.voterGap
    }),
    { adults: 0, idHolders: 0, registeredVoters: 0, gap: 0, voterGap: 0 }
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hair pb-4">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Non Registered Voters (2026 Projection)</h2>
        <div className="grid w-full grid-cols-2 gap-3 sm:w-auto sm:flex sm:flex-wrap sm:gap-6">
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.adults)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Adult Population</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.registeredVoters)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Registered Voters</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.voterGap)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Non Registered Voters</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.idHolders)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Registered IDs</div>
          </div>
          <div className="text-left sm:text-right">
            <div className="tnum text-lg font-bold leading-7 text-ink sm:text-2xl">{fmt(totals.gap)}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-mute sm:text-[11px]">Population Without IDs</div>
          </div>
        </div>
      </div>

      <FilterBar year={year} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <Widget title="Age-specific population distribution">
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
        title="Population by Non Registered Voters (2026 Projection)"
        help="Click a county to filter the whole page to it; click it again to clear. Projected 2026 adult population minus currently registered voters, floored at zero."
      >
        <ShapeMap
          data={voterGapMap}
          label="Not registered"
          height={440}
          mobileHeight={280}
          selectedName={year === "2019" ? filters.county : null}
          onRegionClick={
            year === "2019" ? (name) => setFilters({ county: filters.county === name ? null : name, subCounty: null }) : undefined
          }
        />
        <p className="mt-2 text-[11px] text-mute">Not Registered as Voters: low &rarr; high</p>
      </Widget>

      <Widget
        title="Adult ID Gap by Counties"
        help="Same projected-adults-vs-ID-holders comparison shown on the Eligibility page. Counties with sparse source coverage (notably parts of Nairobi) will show inflated gaps -- likely incomplete administrative records rather than genuinely near-zero ID possession."
      >
        <PivotTable
          rowLabel="County"
          rows={gapRows}
          totalRow={{ name: "Total", ...totals }}
          columns={[
            { key: "adults", label: "Adult Population", align: "right", render: (r) => fmt(r.adults) },
            { key: "registeredVoters", label: "Registered Voters", align: "right", render: (r) => fmt(r.registeredVoters) },
            { key: "voterGap", label: "Non Registered Voters", align: "right", render: (r) => fmt(r.voterGap), bar: (r) => r.voterGap },
            { key: "idHolders", label: "Registered National IDs", align: "right", render: (r) => fmt(r.idHolders) },
            { key: "gap", label: "Population Without IDs", align: "right", render: (r) => fmt(r.gap), bar: (r) => r.gap }
          ]}
        />
      </Widget>
    </div>
  );
}
