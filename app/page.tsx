"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { KenyaMap } from "@/components/charts/KenyaMap";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { chartMotion, rankedBarMotion, chartPalette, axisStyle } from "@/lib/charts/motion";
import { fmt, fmtCompact, fmtPct } from "@/lib/format";

const toTitle = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function ExecutiveOverview() {
  const { widgets: w, error } = useDashboardData("/api/overview");

  return (
    <PageShell
      title="Executive Overview"
      subtitle="National progress toward the goal of training 20 million Kenyans in digital and AI skills by 2032."
    >
      {!w ? (
        <LoadingBlock error={error} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi
              label="Unique learners"
              value={fmt(w.headline.data.uniqueLearners)}
              sub={`${w.headline.data.firstDate} → ${w.headline.data.lastDate}`}
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Enrolments (gross)"
              value={fmt(w.headline.data.enrolments)}
              sub={`${w.headline.data.courses} courses`}
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Progress to 20M"
              value={fmtPct(w.headline.data.progressPct)}
              sub={`${fmtCompact(w.headline.data.uniqueLearners)} of ${fmtCompact(w.headline.data.target)} learners`}
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Counties reached"
              value={`${w.headline.data.counties} / 47`}
              sub="100% county coverage"
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Completion rate"
              value={fmtPct(w.completion.data.completion_rate)}
              sub={`avg quiz ${w.completion.data.avg_quiz ?? "—"}`}
              provenance={w.completion.provenance}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Widget title="Reach by county" provenance={w.countyMap.provenance} className="lg:col-span-1">
              <KenyaMap
                height={360}
                label="Learners"
                data={w.countyMap.data.map((d: { county_label: string; learners: number }) => ({
                  name: d.county_label,
                  value: d.learners
                }))}
              />
            </Widget>
            <Widget title="Daily training activity" provenance={w.trend.provenance} className="lg:col-span-2">
              <EChart
                height={360}
                option={{
                  ...chartMotion,
                  grid: { left: 48, right: 16, top: 24, bottom: 28 },
                  tooltip: { trigger: "axis" },
                  xAxis: { type: "category", data: w.trend.data.map((d: { day: string }) => d.day), ...axisStyle },
                  yAxis: { type: "value", ...axisStyle },
                  series: [
                    {
                      name: "Enrolments",
                      type: "line",
                      smooth: true,
                      symbol: "none",
                      lineStyle: { color: "#ED1C24", width: 2 },
                      areaStyle: { color: "rgba(237,28,36,0.06)" },
                      data: w.trend.data.map((d: { enrolments: number }) => d.enrolments)
                    },
                    {
                      name: "Unique learners",
                      type: "line",
                      smooth: true,
                      symbol: "none",
                      lineStyle: { color: "#101820", width: 1.5, type: "dashed" },
                      data: w.trend.data.map((d: { learners: number }) => d.learners)
                    }
                  ]
                }}
              />
            </Widget>
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            <Widget title="Top counties" provenance={w.topCounties.provenance}>
              <EChart
                height={250}
                option={{
                  ...rankedBarMotion,
                  grid: { left: 86, right: 24, top: 8, bottom: 24 },
                  tooltip: { trigger: "axis" },
                  xAxis: { type: "value", ...axisStyle },
                  yAxis: {
                    type: "category",
                    inverse: true,
                    data: w.topCounties.data.map((d: { county: string }) => toTitle(d.county)),
                    ...axisStyle
                  },
                  series: [
                    {
                      type: "bar",
                      barWidth: 12,
                      itemStyle: { color: "#ED1C24", borderRadius: [0, 2, 2, 0] },
                      data: w.topCounties.data.map((d: { learners: number }) => d.learners)
                    }
                  ]
                }}
              />
            </Widget>
            <Widget title="Course categories" provenance={w.categories.provenance}>
              <EChart
                height={250}
                option={{
                  ...chartMotion,
                  tooltip: { trigger: "item" },
                  color: chartPalette,
                  series: [
                    {
                      type: "pie",
                      radius: ["45%", "70%"],
                      label: { fontSize: 11, color: "#3A4856" },
                      data: w.categories.data.map((d: { course_category: string; enrolments: number }) => ({
                        name: toTitle(d.course_category),
                        value: d.enrolments
                      }))
                    }
                  ]
                }}
              />
            </Widget>
            <Widget title="Gender split" provenance={w.genderSplit.provenance}>
              <EChart
                height={250}
                option={{
                  ...chartMotion,
                  tooltip: { trigger: "item" },
                  color: ["#101820", "#ED1C24", "#6D6E6F"],
                  series: [
                    {
                      type: "pie",
                      radius: ["45%", "70%"],
                      label: { fontSize: 11, color: "#3A4856" },
                      data: w.genderSplit.data.map((d: { gender: string; learners: number }) => ({
                        name: toTitle(d.gender),
                        value: d.learners
                      }))
                    }
                  ]
                }}
              />
            </Widget>
            <div className="flex flex-col gap-3">
              <Kpi
                label="Female participation"
                value={fmtPct(w.inclusion.data.female_rate)}
                provenance={w.inclusion.provenance}
              />
              <Kpi
                label="Learners with disability"
                value={fmt(w.inclusion.data.pwd_learners)}
                provenance={w.inclusion.provenance}
              />
              <Kpi
                label="Data quality"
                value={`${fmt(w.quality.data.duplicate_ids)} duplicate IDs`}
                sub="see Data Quality page"
                provenance={w.quality.provenance}
              />
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
