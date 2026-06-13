"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { KenyaMap } from "@/components/charts/KenyaMap";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { useFilters } from "@/components/dashboard/FilterContext";
import { rankedBarOption } from "@/lib/charts/motion";
import { fmt, labelCase } from "@/lib/format";

interface CountyRow {
  county: string;
  county_label: string;
  learners: number;
  enrolments: number;
  population: number | null;
  per_100k: number | null;
}

export default function GeographyPage() {
  const { widgets: w, error } = useDashboardData("/api/geography");
  const { filters, setFilters } = useFilters();
  const selected = filters.county;

  if (!w) {
    return (
      <PageShell title="Geographic Coverage">
        <LoadingBlock error={error} />
      </PageShell>
    );
  }

  const counties: CountyRow[] = w.counties.data;
  const top10 = counties.slice(0, 10);
  const bottom10 = [...counties].slice(-10).reverse();
  const regions: { region: string; learners: number; enrolments: number }[] | null =
    w.regions?.data ?? null;

  return (
    <PageShell
      title="Geographic Coverage"
      subtitle="Where learners are being reached. Click a county on the map or table to drill into its regions; the selection applies on every page."
    >
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Counties reached" help="Counties with at least one learner in the current filter scope, out of Kenya's 47." value={`${counties.length} / 47`} provenance={w.counties.provenance} />
        <Kpi label="Top county" help="County with the most unique learners in scope." value={top10[0]?.county_label ?? "—"} sub={`${fmt(top10[0]?.learners)} learners`} provenance={w.counties.provenance} />
        <Kpi label="Lowest county" help="County with the fewest unique learners in scope." value={bottom10[0]?.county_label ?? "—"} sub={`${fmt(bottom10[0]?.learners)} learners`} provenance={w.counties.provenance} />
        <Kpi
          label="Best reach per capita"
          help="County with the most learners per 100,000 residents (2019 census), which corrects for population size."
          value={[...counties].sort((a, b) => (b.per_100k ?? 0) - (a.per_100k ?? 0))[0]?.county_label ?? "—"}
          sub="learners per 100k population"
          provenance={w.counties.provenance}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Widget
          title={selected ? `Regions in ${selected}` : "Learner reach map"}
          help={selected ? "Unique learners by region within the selected county." : "Unique learners by county. Click a county to drill into its regions and filter every page."}
          provenance={w.counties.provenance}
          right={
            selected ? (
              <button
                onClick={() => setFilters({ county: null })}
                className="rounded border border-hair px-2 py-1 text-xs text-subink hover:bg-hair2"
              >
                ← back to national
              </button>
            ) : null
          }
        >
          {!selected ? (
            <KenyaMap
              height={460}
              label="Learners"
              onCountyClick={(county) => setFilters({ county })}
              data={counties.map((d) => ({
                name: d.county_label,
                value: d.learners,
                extra: { "Per 100k": d.per_100k, Enrolments: d.enrolments }
              }))}
            />
          ) : regions == null ? (
            <div className="flex h-[460px] items-center justify-center text-sm text-mute">Loading regions…</div>
          ) : (
            <EChart
              height={460}
              option={rankedBarOption(
                regions.map((r) => labelCase(r.region)),
                regions.map((r) => r.learners),
                "#101820"
              )}
            />
          )}
        </Widget>

        <Widget title="County performance" help="Actual learners, enrolments and per-capita reach for every county. Click a row to drill in." provenance={w.counties.provenance}>
          <div className="max-h-[460px] overflow-y-auto pr-3">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-paperalt text-mute">
                <tr className="border-b border-hair">
                  <th className="py-1.5 pr-2 font-medium">County</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Learners</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Enrolments</th>
                  <th className="py-1.5 text-right font-medium">Per 100k</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {counties.map((d) => (
                  <tr
                    key={d.county}
                    className="cursor-pointer border-b border-hair2 hover:bg-hair2"
                    onClick={() => setFilters({ county: d.county_label })}
                  >
                    <td className="py-1.5 pr-2 text-ink">{d.county_label}</td>
                    <td className="py-1.5 pr-2 text-right">{fmt(d.learners)}</td>
                    <td className="py-1.5 pr-2 text-right">{fmt(d.enrolments)}</td>
                    <td className="py-1.5 text-right">{d.per_100k ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Widget>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Top 10 counties", rows: top10, color: "#ED1C24", help: "Counties with the most unique learners." },
          { title: "Bottom 10 counties", rows: bottom10, color: "#6D6E6F", help: "Counties with the fewest unique learners, where reach needs the most attention." }
        ].map((cfg) => (
          <Widget key={cfg.title} title={cfg.title} help={cfg.help} provenance={w.counties.provenance}>
            <EChart
              height={280}
              option={rankedBarOption(
                cfg.rows.map((d) => d.county_label),
                cfg.rows.map((d) => d.learners),
                cfg.color
              )}
            />
          </Widget>
        ))}
      </section>
    </PageShell>
  );
}
