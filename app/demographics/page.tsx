"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { chartMotion, rankedBarMotion, chartPalette, axisStyle } from "@/lib/charts/motion";
import { fmt, fmtPct } from "@/lib/format";

const toTitle = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

function SplitBar({ rows, color = "#ED1C24", height = 240 }: { rows: { label: string; learners: number }[]; color?: string; height?: number }) {
  return (
    <EChart
      height={height}
      option={{
        ...rankedBarMotion,
        grid: { left: 140, right: 30, top: 8, bottom: 24 },
        tooltip: { trigger: "axis" },
        xAxis: { type: "value", ...axisStyle },
        yAxis: { type: "category", inverse: true, data: rows.map((r) => toTitle(r.label)), ...axisStyle },
        series: [
          {
            type: "bar",
            barWidth: 12,
            itemStyle: { color, borderRadius: [0, 2, 2, 0] },
            data: rows.map((r) => r.learners)
          }
        ]
      }}
    />
  );
}

export default function DemographicsPage() {
  const { widgets: w, error } = useDashboardData("/api/demographics");

  return (
    <PageShell
      title="Demographics & Inclusion"
      subtitle="Participation by gender, age, disability, education and employment. Splits are modeled estimates over real learner counts until Datasets 2 and 7 are loaded."
    >
      {!w ? (
        <LoadingBlock error={error} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Female participation" value={fmtPct(w.kpis.data.female_rate)} provenance={w.kpis.provenance} />
            <Kpi label="Youth (18–34)" value={fmtPct(w.kpis.data.youth_rate)} provenance={w.kpis.provenance} />
            <Kpi
              label="Persons with disability"
              value={fmt(w.kpis.data.pwd_learners)}
              sub={`${w.kpis.data.pwd_rate}% of learners`}
              provenance={w.kpis.provenance}
            />
            <Kpi label="Device access" value={fmtPct(w.kpis.data.device_rate)} sub={`internet: ${w.kpis.data.internet_rate}%`} provenance={w.kpis.provenance} />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Widget title="Gender distribution" provenance={w.gender.provenance}>
              <EChart
                height={240}
                option={{
                  ...chartMotion,
                  tooltip: { trigger: "item" },
                  color: chartPalette,
                  series: [
                    {
                      type: "pie",
                      radius: ["45%", "70%"],
                      label: { fontSize: 11, color: "#3A4856" },
                      data: w.gender.data.map((d: { label: string; learners: number }) => ({
                        name: toTitle(d.label),
                        value: d.learners
                      }))
                    }
                  ]
                }}
              />
            </Widget>
            <Widget title="Age groups" provenance={w.age.provenance}>
              <EChart
                height={240}
                option={{
                  ...chartMotion,
                  grid: { left: 48, right: 16, top: 16, bottom: 28 },
                  tooltip: { trigger: "axis" },
                  xAxis: { type: "category", data: w.age.data.map((d: { label: string }) => d.label), ...axisStyle },
                  yAxis: { type: "value", ...axisStyle },
                  series: [
                    {
                      type: "bar",
                      barWidth: 28,
                      itemStyle: { color: "#101820", borderRadius: [2, 2, 0, 0] },
                      data: w.age.data.map((d: { learners: number }) => d.learners)
                    }
                  ]
                }}
              />
            </Widget>
            <Widget title="Disability profile" provenance={w.disability.provenance}>
              <SplitBar rows={w.disability.data.filter((d: { label: string }) => d.label !== "NO DISABILITY")} color="#9A6E20" />
            </Widget>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Widget title="Education level at intake" provenance={w.education.provenance}>
              <SplitBar rows={w.education.data} />
            </Widget>
            <Widget title="Employment status at intake" provenance={w.employment.provenance}>
              <SplitBar rows={w.employment.data} color="#5E6B7A" />
            </Widget>
          </section>
        </>
      )}
    </PageShell>
  );
}
