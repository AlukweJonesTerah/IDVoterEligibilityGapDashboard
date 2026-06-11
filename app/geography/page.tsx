"use client";

import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { KenyaMap } from "@/components/charts/KenyaMap";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { rankedBarMotion, axisStyle } from "@/lib/charts/motion";
import { fmt, fmtPct } from "@/lib/format";

interface CountyRow {
  county: string;
  county_label: string;
  learners: number;
  enrolments: number;
  population: number | null;
  per_100k: number | null;
  completion_rate: number | null;
  female_rate: number | null;
  pwd_learners: number | null;
}

export default function GeographyPage() {
  const { widgets: w, error } = useDashboardData("/api/geography");
  const [selected, setSelected] = useState<string | null>(null);
  const [regions, setRegions] = useState<{ region: string; learners: number; enrolments: number }[] | null>(null);

  useEffect(() => {
    if (!selected) return setRegions(null);
    fetch(`/api/geography?county=${encodeURIComponent(selected)}`)
      .then((r) => r.json())
      .then((json) => setRegions(json.widgets.regions?.data ?? []));
  }, [selected]);

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

  return (
    <PageShell
      title="Geographic Coverage"
      subtitle="Where learners are being reached. Click a county on the map to drill into its regions."
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Counties reached" value={`${counties.length} / 47`} provenance={w.counties.provenance} />
        <Kpi label="Top county" value={top10[0]?.county_label ?? "—"} sub={`${fmt(top10[0]?.learners)} learners`} provenance={w.counties.provenance} />
        <Kpi
          label="Lowest county"
          value={bottom10[0]?.county_label ?? "—"}
          sub={`${fmt(bottom10[0]?.learners)} learners`}
          provenance={w.counties.provenance}
        />
        <Kpi
          label="Best reach per capita"
          value={[...counties].sort((a, b) => (b.per_100k ?? 0) - (a.per_100k ?? 0))[0]?.county_label ?? "—"}
          sub="learners per 100k population"
          provenance={w.counties.provenance}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Widget
          title={selected ? `Regions in ${selected}` : "Learner reach map"}
          provenance={w.counties.provenance}
          right={
            selected ? (
              <button onClick={() => setSelected(null)} className="rounded border border-hair px-2 py-1 text-xs text-subink hover:bg-hair2">
                ← back to national
              </button>
            ) : null
          }
        >
          {!selected ? (
            <KenyaMap
              height={460}
              label="Learners"
              onCountyClick={(c) => setSelected(c)}
              data={counties.map((d) => ({
                name: d.county_label,
                value: d.learners,
                extra: {
                  "Per 100k": d.per_100k,
                  "Completion (modeled)": d.completion_rate != null ? `${d.completion_rate}%` : null
                }
              }))}
            />
          ) : regions == null ? (
            <div className="flex h-[460px] items-center justify-center text-sm text-mute">Loading regions…</div>
          ) : (
            <EChart
              height={460}
              option={{
                ...rankedBarMotion,
                grid: { left: 130, right: 30, top: 8, bottom: 24 },
                tooltip: { trigger: "axis" },
                xAxis: { type: "value", ...axisStyle },
                yAxis: { type: "category", inverse: true, data: regions.map((r) => r.region), ...axisStyle },
                series: [
                  {
                    type: "bar",
                    barWidth: 12,
                    itemStyle: { color: "#101820", borderRadius: [0, 2, 2, 0] },
                    data: regions.map((r) => r.learners)
                  }
                ]
              }}
            />
          )}
        </Widget>

        <Widget title="County performance" provenance={w.counties.provenance}>
          <div className="max-h-[460px] overflow-y-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="sticky top-0 bg-paperalt text-mute">
                <tr className="border-b border-hair">
                  <th className="py-1.5 pr-2 font-medium">County</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Learners</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Per 100k</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Completion*</th>
                  <th className="py-1.5 text-right font-medium">Female*</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {counties.map((c) => (
                  <tr
                    key={c.county}
                    className="cursor-pointer border-b border-hair2 hover:bg-hair2"
                    onClick={() => setSelected(c.county_label)}
                  >
                    <td className="py-1.5 pr-2 text-ink">{c.county_label}</td>
                    <td className="py-1.5 pr-2 text-right">{fmt(c.learners)}</td>
                    <td className="py-1.5 pr-2 text-right">{c.per_100k ?? "—"}</td>
                    <td className="py-1.5 pr-2 text-right">{fmtPct(c.completion_rate)}</td>
                    <td className="py-1.5 text-right">{fmtPct(c.female_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[10.5px] text-mute">* modeled estimate pending source datasets</p>
          </div>
        </Widget>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Top 10 counties", rows: top10, color: "#ED1C24" },
          { title: "Bottom 10 counties", rows: bottom10, color: "#6D6E6F" }
        ].map((cfg) => (
          <Widget key={cfg.title} title={cfg.title} provenance={w.counties.provenance}>
            <EChart
              height={260}
              option={{
                ...rankedBarMotion,
                grid: { left: 100, right: 30, top: 8, bottom: 24 },
                tooltip: { trigger: "axis" },
                xAxis: { type: "value", ...axisStyle },
                yAxis: { type: "category", inverse: true, data: cfg.rows.map((d) => d.county_label), ...axisStyle },
                series: [
                  {
                    type: "bar",
                    barWidth: 12,
                    itemStyle: { color: cfg.color, borderRadius: [0, 2, 2, 0] },
                    data: cfg.rows.map((d) => d.learners)
                  }
                ]
              }}
            />
          </Widget>
        ))}
      </section>
    </PageShell>
  );
}
