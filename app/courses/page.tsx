"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import {
  chartMotion,
  chartPalette,
  donutOption,
  rankedBarOption,
  timeLineOption
} from "@/lib/charts/motion";
import { fmt, fmtPct, labelCase } from "@/lib/format";

interface CourseRow {
  course: string;
  category: string;
  enrolments: number;
  learners: number;
  completion_rate: number | null;
  avg_quiz: number | null;
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="eyebrow border-b border-hair pb-1.5 text-[12px]">{children}</h2>;
}

export default function CoursesAndPipelinePage() {
  const { widgets: c, error: cError } = useDashboardData("/api/courses");
  const { widgets: p, error: pError } = useDashboardData("/api/pipeline");

  if (!c || !p) {
    return (
      <PageShell title="Courses & Pipeline">
        <LoadingBlock error={cError ?? pError} />
      </PageShell>
    );
  }

  const courses: CourseRow[] = c.courses.data;
  const top = courses[0];
  const bestCompletion = [...courses].sort((a, b) => (b.completion_rate ?? 0) - (a.completion_rate ?? 0))[0];

  return (
    <PageShell
      title="Course Performance & Training Pipeline"
      subtitle="What learners take and finish, and how they move from registration to certification readiness."
    >
      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Courses offered" help="Number of distinct courses with enrolments in the current scope." value={String(courses.length)} provenance={c.courses.provenance} />
        <Kpi label="Most popular" help="Course with the most enrolments." value={labelCase(top?.course)} sub={`${fmt(top?.enrolments)} enrolments`} provenance={c.courses.provenance} />
        <Kpi label="Best completion" help="Course with the highest completion rate among started enrolments." value={labelCase(bestCompletion?.course)} sub={fmtPct(bestCompletion?.completion_rate)} provenance={c.courses.provenance} />
        <Kpi
          label="Categories"
          help="Course categories on offer."
          value={String(c.categories.data.length)}
          sub={c.categories.data.map((x: { category: string }) => labelCase(x.category)).join(" · ")}
          provenance={c.categories.provenance}
        />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi compact label="Registered" help="Distinct learners registered in the programme." value={fmt(p.funnel.data.registered)} provenance={p.funnel.provenance} />
        <Kpi compact label="Enrolled" help="Course enrolments; one learner can enrol in several courses." value={fmt(p.funnel.data.enrolled)} provenance={p.funnel.provenance} />
        <Kpi compact label="Started" help="Enrolments where the learner has begun the course." value={fmt(p.funnel.data.started)} provenance={p.funnel.provenance} />
        <Kpi compact label="Completed" help="Enrolments completed end to end." value={fmt(p.funnel.data.completed)} provenance={p.funnel.provenance} />
        <Kpi compact label="Certification-ready" help="Completed enrolments that also meet the assessment threshold for certification." value={fmt(p.funnel.data.certification_ready)} provenance={p.funnel.provenance} />
      </section>

      <SectionTitle>Courses</SectionTitle>

      <section className="grid gap-4 lg:grid-cols-3">
        <Widget title="Category mix" help="How enrolments split across the course categories." provenance={c.categories.provenance}>
          <EChart
            height={400}
            option={donutOption(
              c.categories.data.map((d: { category: string; enrolments: number }) => ({
                name: labelCase(d.category),
                value: d.enrolments
              })),
              chartPalette
            )}
          />
        </Widget>
        <Widget title="Course leaderboard (enrolments)" help="Top 15 courses by enrolments. Hover a bar for the full course name." provenance={c.courses.provenance} className="lg:col-span-2">
          <EChart
            height={400}
            option={rankedBarOption(
              courses.slice(0, 15).map((x) => labelCase(x.course)),
              courses.slice(0, 15).map((x) => x.enrolments),
              "#ED1C24"
            )}
          />
        </Widget>
      </section>

      <SectionTitle>Training pipeline</SectionTitle>

      <section className="grid gap-4 lg:grid-cols-2">
        <Widget title="Learner journey funnel" help="How learners move from registration through enrolment, starting, completing and reaching certification readiness." provenance={p.funnel.provenance}>
          <EChart
            height={320}
            option={{
              ...chartMotion,
              tooltip: { trigger: "item", formatter: "{b}: {c}" },
              series: [
                {
                  type: "funnel",
                  sort: "none",
                  left: "4%",
                  width: "92%",
                  top: 10,
                  bottom: 10,
                  minSize: "24%",
                  gap: 3,
                  label: { position: "inside", fontSize: 11.5, color: "#FFFFFF", formatter: "{b}" },
                  itemStyle: { borderWidth: 0 },
                  color: ["#101820", "#ED1C24", "#6D6E6F", "#00A651", "#8A9099"],
                  data: [
                    { name: "Registered", value: p.funnel.data.registered },
                    { name: "Enrolled", value: p.funnel.data.enrolled },
                    { name: "Started", value: p.funnel.data.started },
                    { name: "Completed", value: p.funnel.data.completed },
                    { name: "Certification-ready", value: p.funnel.data.certification_ready }
                  ]
                }
              ]
            }}
          />
        </Widget>

        <Widget title="Daily training activity" help="Training records per day; the dashed line is distinct learners that day." provenance={p.dailyActivity.provenance}>
          <EChart
            height={320}
            option={timeLineOption([
              {
                name: "Enrolments",
                color: "#ED1C24",
                area: true,
                points: p.dailyActivity.data.map((d: { day: string; enrolments: number }) => [d.day, d.enrolments])
              },
              {
                name: "Unique learners",
                color: "#101820",
                dashed: true,
                points: p.dailyActivity.data.map((d: { day: string; learners: number }) => [d.day, d.learners])
              }
            ])}
          />
        </Widget>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Widget title="Completions over time" help="Course completions per day." provenance={p.completionTrend.provenance}>
          <EChart
            height={300}
            option={timeLineOption([
              {
                name: "Completions",
                color: "#9A6E20",
                area: true,
                points: p.completionTrend.data.map((d: { day: string; completions: number }) => [d.day, d.completions])
              }
            ])}
          />
        </Widget>

        <Widget title="Drop-off by county (not started)" help="Share of enrolments where the learner never started, by county. High bars need follow-up." provenance={p.dropoff.provenance}>
          <EChart
            height={300}
            option={rankedBarOption(
              p.dropoff.data.map((d: { county: string }) => d.county),
              p.dropoff.data.map((d: { dropoff_rate: number }) => d.dropoff_rate),
              "#3A4856",
              { pct: true }
            )}
          />
        </Widget>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Widget title="Cohort progress (synthetic structures)" help="Largest cohorts and their completion rates. Cohort structures are placeholders until the real cohort datasets load." provenance={p.cohorts.provenance}>
          <div className="max-h-[320px] overflow-y-auto pr-3">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-paperalt text-mute">
                <tr className="border-b border-hair">
                  <th className="py-1.5 pr-2 font-medium">Cohort</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Learners</th>
                  <th className="py-1.5 text-right font-medium">Completion</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {p.cohorts.data.map((x: { cohort: string; learners: number; completion_rate: number }) => (
                  <tr key={x.cohort} className="border-b border-hair2">
                    <td className="py-1.5 pr-2 text-ink">{labelCase(x.cohort)}</td>
                    <td className="py-1.5 pr-2 text-right">{fmt(x.learners)}</td>
                    <td className="py-1.5 text-right">{fmtPct(x.completion_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Widget>

        <Widget title="Course performance matrix" help="Every course with its enrolments, learners, completion rate and average quiz score." provenance={c.courses.provenance}>
          <div className="max-h-[320px] overflow-y-auto pr-3">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-paperalt text-mute">
                <tr className="border-b border-hair">
                  <th className="py-1.5 pr-2 font-medium">Course</th>
                  <th className="py-1.5 pr-2 font-medium">Category</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Enrolments</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Completion*</th>
                  <th className="py-1.5 text-right font-medium">Avg quiz*</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {courses.map((x) => (
                  <tr key={x.course} className="border-b border-hair2">
                    <td className="py-1.5 pr-2 text-ink">{labelCase(x.course)}</td>
                    <td className="py-1.5 pr-2 text-mute">{labelCase(x.category)}</td>
                    <td className="py-1.5 pr-2 text-right">{fmt(x.enrolments)}</td>
                    <td className="py-1.5 pr-2 text-right">{fmtPct(x.completion_rate)}</td>
                    <td className="py-1.5 text-right">{x.avg_quiz ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-mute">* modeled estimate pending the course completion dataset</p>
          </div>
        </Widget>
      </section>
    </PageShell>
  );
}
