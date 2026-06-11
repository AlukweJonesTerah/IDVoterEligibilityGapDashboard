"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { chartMotion, rankedBarMotion, axisStyle } from "@/lib/charts/motion";
import { fmt, fmtPct } from "@/lib/format";

export default function PipelinePage() {
  const { widgets: w, error } = useDashboardData("/api/pipeline");

  return (
    <PageShell
      title="Training Pipeline"
      subtitle="Learner journey from registration to certification readiness. Journey stages beyond enrolment are modeled pending the completion dataset."
    >
      {!w ? (
        <LoadingBlock error={error} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Registered" value={fmt(w.funnel.data.registered)} provenance={w.funnel.provenance} />
            <Kpi label="Enrolled" value={fmt(w.funnel.data.enrolled)} provenance={w.funnel.provenance} />
            <Kpi label="Started" value={fmt(w.funnel.data.started)} provenance={w.funnel.provenance} />
            <Kpi label="Completed" value={fmt(w.funnel.data.completed)} provenance={w.funnel.provenance} />
            <Kpi label="Certification-ready" value={fmt(w.funnel.data.certification_ready)} provenance={w.funnel.provenance} />
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Widget title="Learner journey funnel" provenance={w.funnel.provenance}>
              <EChart
                height={320}
                option={{
                  ...chartMotion,
                  tooltip: { trigger: "item", formatter: "{b}: {c}" },
                  series: [
                    {
                      type: "funnel",
                      sort: "none",
                      left: "8%",
                      width: "84%",
                      top: 10,
                      bottom: 10,
                      minSize: "22%",
                      gap: 3,
                      label: { fontSize: 11.5, color: "#0E1722", formatter: "{b}" },
                      itemStyle: { borderWidth: 0 },
                      color: ["#101820", "#ED1C24", "#6D6E6F", "#00A651", "#B0B5BC"],
                      data: [
                        { name: "Registered", value: w.funnel.data.registered },
                        { name: "Enrolled", value: w.funnel.data.enrolled },
                        { name: "Started", value: w.funnel.data.started },
                        { name: "Completed", value: w.funnel.data.completed },
                        { name: "Certification-ready", value: w.funnel.data.certification_ready }
                      ]
                    }
                  ]
                }}
              />
            </Widget>

            <Widget title="Completions over time" provenance={w.completionTrend.provenance}>
              <EChart
                height={320}
                option={{
                  ...chartMotion,
                  grid: { left: 48, right: 16, top: 24, bottom: 28 },
                  tooltip: { trigger: "axis" },
                  xAxis: { type: "category", data: w.completionTrend.data.map((d: { day: string }) => d.day), ...axisStyle },
                  yAxis: { type: "value", ...axisStyle },
                  series: [
                    {
                      type: "line",
                      smooth: true,
                      symbol: "none",
                      lineStyle: { color: "#9A6E20", width: 2 },
                      areaStyle: { color: "rgba(154,110,32,0.10)" },
                      data: w.completionTrend.data.map((d: { completions: number }) => d.completions)
                    }
                  ]
                }}
              />
            </Widget>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Widget title="Drop-off by county (not started)" provenance={w.dropoff.provenance}>
              <EChart
                height={300}
                option={{
                  ...rankedBarMotion,
                  grid: { left: 100, right: 36, top: 8, bottom: 24 },
                  tooltip: { trigger: "axis", valueFormatter: (v: number) => `${v}%` },
                  xAxis: { type: "value", ...axisStyle, axisLabel: { ...axisStyle.axisLabel, formatter: "{value}%" } },
                  yAxis: { type: "category", inverse: true, data: w.dropoff.data.map((d: { county: string }) => d.county), ...axisStyle },
                  series: [
                    {
                      type: "bar",
                      barWidth: 12,
                      itemStyle: { color: "#3A4856", borderRadius: [0, 2, 2, 0] },
                      data: w.dropoff.data.map((d: { dropoff_rate: number }) => d.dropoff_rate)
                    }
                  ]
                }}
              />
            </Widget>

            <Widget title="Cohort progress (synthetic structures)" provenance={w.cohorts.provenance}>
              <div className="max-h-[300px] overflow-y-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-paperalt text-mute">
                    <tr className="border-b border-hair">
                      <th className="py-1.5 pr-2 font-medium">Cohort</th>
                      <th className="py-1.5 pr-2 text-right font-medium">Learners</th>
                      <th className="py-1.5 text-right font-medium">Completion</th>
                    </tr>
                  </thead>
                  <tbody className="tnum">
                    {w.cohorts.data.map((c: { cohort: string; learners: number; completion_rate: number }) => (
                      <tr key={c.cohort} className="border-b border-hair2">
                        <td className="py-1.5 pr-2 text-ink">{c.cohort}</td>
                        <td className="py-1.5 pr-2 text-right">{fmt(c.learners)}</td>
                        <td className="py-1.5 text-right">{fmtPct(c.completion_rate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Widget>
          </section>
        </>
      )}
    </PageShell>
  );
}
