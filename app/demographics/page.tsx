"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { UnavailableNote } from "@/components/dashboard/Provenance";
import { EChart } from "@/components/charts/EChart";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { chartMotion, chartPalette, axisStyle, donutOption, rankedBarOption } from "@/lib/charts/motion";
import { fmt, fmtPct, labelCase } from "@/lib/format";

export default function DemographicsPage() {
  const { widgets: w, error } = useDashboardData("/api/demographics");

  // Per-card coverage: each KPI card states only its own field's coverage.
  const kpiProv = (coverage: string) => (w ? { ...w.kpis.provenance, coverage } : undefined);

  return (
    <PageShell
      title="Demographics & Inclusion"
      subtitle="Participation by gender, age, disability and education, from the live records that carry demographic data. Coverage is partial; hover any dot for the honest denominator."
    >
      {!w ? (
        <LoadingBlock error={error} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Female participation"
              help="Share female among pooled records with a known gender."
              value={fmtPct(w.kpis.data.female_rate)}
              provenance={kpiProv(`Gender known for ${fmt(w.kpis.data.gender_known)} of ${fmt(w.kpis.data.persons)} pooled records.`)}
            />
            <Kpi
              label="Youth (18-34)"
              help="Share aged 18 to 34 among pooled records with a known age group."
              value={fmtPct(w.kpis.data.youth_rate)}
              provenance={kpiProv(`Age group known for ${fmt(w.kpis.data.age_known)} of ${fmt(w.kpis.data.persons)} pooled records. Bands harmonized from inconsistent source buckets into standard ranges.`)}
            />
            <Kpi
              label="Persons with disability"
              help="Pooled records reporting a disability, of those with a disability response."
              value={fmt(w.kpis.data.pwd_learners)}
              provenance={kpiProv(`Disability response recorded for ${fmt(w.kpis.data.disability_known)} of ${fmt(w.kpis.data.persons)} pooled records.`)}
            />
            <Kpi
              label="Device access"
              help="Device availability is recorded only for the Busia pilot records; not a national measure."
              value={fmtPct(w.kpis.data.device_rate)}
              provenance={kpiProv(`Device availability recorded for ${fmt(w.kpis.data.device_known)} records (Busia pilot only).`)}
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Widget title="Gender distribution" help="Pooled records with a known gender." provenance={w.gender.provenance}>
              <EChart
                height={260}
                option={donutOption(
                  w.gender.data.map((d: { label: string; learners: number }) => ({
                    name: labelCase(d.label),
                    value: d.learners
                  })),
                  chartPalette
                )}
              />
            </Widget>
            <Widget title="Age groups" help="Pooled records by age band." provenance={w.age.provenance}>
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
            <Widget
              title="Disability inclusion"
              help="Pooled records with a disability response: reported disability versus none."
              provenance={w.disability.provenance}
            >
              <EChart
                height={260}
                option={donutOption(
                  w.disability.data.map((d: { label: string; learners: number }) => ({
                    name: labelCase(d.label),
                    value: d.learners
                  })),
                  chartPalette
                )}
              />
            </Widget>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <Widget
              title="Education level"
              help="Highest education level where recorded (Busia and county cohort sources)."
              provenance={w.education.provenance}
            >
              <EChart
                height={280}
                option={rankedBarOption(
                  w.education.data.map((d: { label: string }) => labelCase(d.label)),
                  w.education.data.map((d: { learners: number }) => d.learners),
                  "#ED1C24"
                )}
              />
            </Widget>
            <Widget
              title="Device availability (Busia pilot)"
              help="Device availability from the Busia pilot records only; not a national measure."
              provenance={w.device.provenance}
            >
              <EChart
                height={280}
                option={donutOption(
                  w.device.data.map((d: { label: string; learners: number }) => ({
                    name: labelCase(d.label),
                    value: d.learners
                  })),
                  chartPalette
                )}
              />
            </Widget>
            <Widget
              title="Employment status"
              help="Employment status comes from the learner baseline dataset."
              provenance={w.employment.provenance}
            >
              <UnavailableNote reason="The learner baseline dataset exists in the live database but has no rows yet. Employment, income and impact measures will appear when it is populated." />
            </Widget>
          </section>
        </>
      )}
    </PageShell>
  );
}
