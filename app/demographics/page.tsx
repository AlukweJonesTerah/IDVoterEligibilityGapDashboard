"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { chartMotion, axisStyle, donutOption, rankedBarOption } from "@/lib/charts/motion";
import { fmt, fmtPct, labelCase } from "@/lib/format";

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
            <Kpi label="Youth (18-34)" value={fmtPct(w.kpis.data.youth_rate)} provenance={w.kpis.provenance} />
            <Kpi
              label="Persons with disability"
              value={fmt(w.kpis.data.pwd_learners)}
              sub={`${w.kpis.data.pwd_rate ?? "—"}% of learners`}
              provenance={w.kpis.provenance}
            />
            <Kpi
              label="Device access"
              value={fmtPct(w.kpis.data.device_rate)}
              sub={`internet: ${w.kpis.data.internet_rate ?? "—"}%`}
              provenance={w.kpis.provenance}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Widget title="Gender distribution" provenance={w.gender.provenance}>
              <EChart
                height={260}
                option={donutOption(
                  w.gender.data.map((d: { label: string; learners: number }) => ({
                    name: labelCase(d.label),
                    value: d.learners
                  })),
                  ["#101820", "#ED1C24", "#6D6E6F"]
                )}
              />
            </Widget>
            <Widget title="Age groups" provenance={w.age.provenance}>
              <EChart
                height={260}
                option={{
                  ...chartMotion,
                  grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
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
              <EChart
                height={260}
                option={rankedBarOption(
                  w.disability.data
                    .filter((d: { label: string }) => d.label !== "NO DISABILITY")
                    .map((d: { label: string }) => labelCase(d.label)),
                  w.disability.data
                    .filter((d: { label: string }) => d.label !== "NO DISABILITY")
                    .map((d: { learners: number }) => d.learners),
                  "#9A6E20"
                )}
              />
            </Widget>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <Widget title="Education level at intake" provenance={w.education.provenance}>
              <EChart
                height={280}
                option={rankedBarOption(
                  w.education.data.map((d: { label: string }) => labelCase(d.label)),
                  w.education.data.map((d: { learners: number }) => d.learners),
                  "#ED1C24"
                )}
              />
            </Widget>
            <Widget title="Employment status at intake" provenance={w.employment.provenance}>
              <EChart
                height={280}
                option={rankedBarOption(
                  w.employment.data.map((d: { label: string }) => labelCase(d.label)),
                  w.employment.data.map((d: { learners: number }) => d.learners),
                  "#5E6B7A"
                )}
              />
            </Widget>
          </section>
        </>
      )}
    </PageShell>
  );
}
