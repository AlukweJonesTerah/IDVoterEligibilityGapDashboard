"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { KenyaMap } from "@/components/charts/KenyaMap";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { useFilters } from "@/components/dashboard/FilterContext";
import { chartMotion, chartPalette, axisStyle, donutOption, rankedBarOption } from "@/lib/charts/motion";
import { fmt, fmtCompact, fmtPct, labelCase } from "@/lib/format";

export default function ExecutiveOverview() {
  const { widgets: w, error } = useDashboardData("/api/overview");
  const { setFilters } = useFilters();

  // Per-card coverage: each inclusion card states only its own field's coverage.
  const incProv = (coverage: string) => (w ? { ...w.inclusion.provenance, coverage } : undefined);

  return (
    <PageShell
      title="Executive Overview"
      subtitle="National progress toward the goal of training 20 million Kenyans in digital and AI skills by 2032."
    >
      {!w ? (
        <LoadingBlock error={error} />
      ) : (
        <>
          {/* Row 1: core programme progress */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Kpi
              label="Unique learners"
              help="Distinct individuals trained, counted once no matter how many courses they take. This is the official figure tracked against the 20 million target."
              value={fmt(w.headline.data.uniqueLearners)}
              sub="distinct individuals, counted once"
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Total trainings"
              help="Every course participation record. One learner taking five courses counts five times here."
              value={fmt(w.headline.data.enrolments)}
              sub="all course participation records"
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Progress to 20M"
              help="Unique learners as a share of the national target of 20 million Kenyans skilled by 2032."
              value={fmtPct(w.headline.data.progressPct)}
              sub={`${fmtCompact(w.headline.data.uniqueLearners)} of ${fmtCompact(w.headline.data.target)} learners`}
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Counties reached"
              help="Counties with at least one learner in the current filter scope, out of Kenya's 47."
              value={`${w.headline.data.counties} / 47`}
              sub="counties in current scope"
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Completion rate"
              help="A national completion rate cannot be computed yet: only a small pilot slice of actual completion records is loaded. No modeled estimate is shown. Hover the source dot for the record count."
              value="Not yet measured"
              provenance={w.completion.provenance}
            />
          </section>

          {/* Row 2: inclusion highlights. Each card's popup states its own coverage. */}
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi compact label="Female participation" help="Share female among pooled records with a known gender." value={fmtPct(w.inclusion.data.female_rate)} provenance={incProv(`Gender known for ${fmt(w.inclusion.data.gender_known)} of ${fmt(w.inclusion.data.persons)} pooled records.`)} />
            <Kpi compact label="Youth (18-34)" help="Share aged 18 to 34 among pooled records with a known age group." value={fmtPct(w.inclusion.data.youth_rate)} provenance={incProv(`Age group known for ${fmt(w.inclusion.data.age_known)} of ${fmt(w.inclusion.data.persons)} pooled records. Bands harmonized from inconsistent source buckets into standard ranges.`)} />
            <Kpi compact label="Persons with disability" help="Pooled records reporting a disability, of those with a disability response." value={fmt(w.inclusion.data.pwd_learners)} provenance={incProv(`Disability response recorded for ${fmt(w.inclusion.data.disability_known)} of ${fmt(w.inclusion.data.persons)} pooled records.`)} />
            <Kpi compact label="Device access" help="Device availability is recorded only for the Busia pilot records; this is not a national measure." value={fmtPct(w.inclusion.data.device_rate)} provenance={incProv(`Device availability recorded for ${fmt(w.inclusion.data.device_known)} records (Busia pilot only).`)} />
          </section>

          {/* Main visual area: map + demographic highlights */}
          <section className="grid gap-4 lg:grid-cols-3">
            <Widget title="Reach by county" help="Unique learners by county. Darker red means more learners. Click a county to filter the whole dashboard to it." provenance={w.countyMap.provenance}>
              <KenyaMap
                height={380}
                mobileHeight={300}
                label="Learners"
                onCountyClick={(county) => setFilters({ county })}
                data={w.countyMap.data.map((d: { county_label: string; learners: number }) => ({
                  name: d.county_label,
                  value: d.learners
                }))}
              />
              <p className="mt-1 text-[11px] text-mute">Click a county to filter every page to it.</p>
            </Widget>
            <Widget title="Age groups" help="Pooled records by age band. Covers the records with demographic data, not the full learner base." provenance={w.age.provenance}>
              <EChart
                height={380}
                mobileHeight={240}
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
            <Widget title="Disability inclusion" help="Pooled records with a disability response: reported disability versus none." provenance={w.disability.provenance}>
              <EChart
                height={380}
                mobileHeight={260}
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

          {/* Lower summary area */}
          <section className="grid gap-4 lg:grid-cols-4">
            <Widget title="Top 5 counties" help="Counties with the most unique learners. The full ranking is on the Geographic Coverage tab." provenance={w.countyMap.provenance}>
              <EChart
                height={230}
                option={rankedBarOption(
                  w.countyMap.data.slice(0, 5).map((d: { county_label: string }) => d.county_label),
                  w.countyMap.data.slice(0, 5).map((d: { learners: number }) => d.learners),
                  "#ED1C24"
                )}
              />
            </Widget>
            <Widget title="Bottom 5 counties" help="Counties with the fewest unique learners, where reach needs the most attention." provenance={w.countyMap.provenance}>
              <EChart
                height={230}
                option={rankedBarOption(
                  w.countyMap.data.slice(-5).reverse().map((d: { county_label: string }) => d.county_label),
                  w.countyMap.data.slice(-5).reverse().map((d: { learners: number }) => d.learners),
                  "#6D6E6F"
                )}
              />
            </Widget>
            <Widget title="Course categories" help="How enrolments split across the course categories." provenance={w.categories.provenance}>
              <EChart
                height={230}
                option={donutOption(
                  w.categories.data.map((d: { course_category: string; enrolments: number }) => ({
                    name: labelCase(d.course_category),
                    value: d.enrolments
                  })),
                  chartPalette
                )}
              />
            </Widget>
            <Widget title="Gender split" help="Pooled records with a known gender." provenance={w.genderSplit.provenance}>
              <EChart
                height={230}
                option={donutOption(
                  w.genderSplit.data.map((d: { gender: string; learners: number }) => ({
                    name: labelCase(d.gender),
                    value: d.learners
                  })),
                  chartPalette
                )}
              />
            </Widget>
          </section>
        </>
      )}
    </PageShell>
  );
}
