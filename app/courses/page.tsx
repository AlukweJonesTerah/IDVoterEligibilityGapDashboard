"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { UnavailableNote } from "@/components/dashboard/Provenance";
import { EChart } from "@/components/charts/EChart";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { chartPalette, donutOption, rankedBarOption, timeLineOption } from "@/lib/charts/motion";
import { fmt, labelCase } from "@/lib/format";

interface CourseRow {
  course: string;
  category: string;
  enrolments: number;
  learners: number;
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

  return (
    <PageShell
      title="Course Performance & Training Pipeline"
      subtitle="What learners take, plus registration intake and the completion data received so far. All figures come from live source data."
    >
      {/* Summary cards */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Courses offered" help="Number of distinct courses with enrolments in the current scope." value={String(courses.length)} provenance={c.courses.provenance} />
        <Kpi label="Most popular" help="Course with the most enrolments." value={labelCase(top?.course)} sub={`${fmt(top?.enrolments)} enrolments`} provenance={c.courses.provenance} />
        <Kpi
          label="Registrations received"
          help="Intake records from the registration source. There is no shared learner key to the training table, so this is a separate measure and is never added to trained learners."
          value={fmt(c.registrations.data.total)}
          sub="intake; separate from trained learners"
          provenance={c.registrations.provenance}
        />
        <Kpi
          label="Categories"
          help="Course categories on offer."
          value={String(c.categories.data.length)}
          sub={c.categories.data.map((x: { category: string }) => labelCase(x.category)).join(" · ")}
          provenance={c.categories.provenance}
        />
      </section>
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi compact label="Registered" help="Distinct learners in the training records." value={fmt(p.funnel.data.registered)} provenance={p.funnel.provenance} />
        <Kpi compact label="Enrolled" help="Course enrolments; one learner can enrol in several courses." value={fmt(p.funnel.data.enrolled)} provenance={p.funnel.provenance} />
        <Kpi
          compact
          label="Completion records"
          help="Actual completion records received so far; a pilot slice, not a national measure."
          value={fmt(p.completionSummary.data.records)}
          sub={`avg quiz ${p.completionSummary.data.avg_quiz ?? "—"}`}
          provenance={p.completionSummary.provenance}
        />
        <Kpi
          compact
          label="Completion / certification rate"
          help="Cannot be computed nationally yet: completion data covers only a small pilot slice."
          value="Not yet measured"
          provenance={p.funnel.provenance}
        />
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
        <Widget title="Daily training activity" help="Training records per day; the dashed line is distinct learners that day." provenance={p.dailyActivity.provenance}>
          <EChart
            height={300}
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

        <Widget
          title="Learner journey"
          help="Stages beyond enrolment need national completion and certification data, which the source does not have yet."
          provenance={p.funnel.provenance}
        >
          <div className="flex h-[300px] flex-col justify-center gap-3">
            {[
              { label: "Registered", value: p.funnel.data.registered, width: 98, cls: "bg-icta-black" },
              { label: "Enrolled", value: p.funnel.data.enrolled, width: 100, cls: "bg-icta-red" }
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="w-24 text-right text-xs text-subink">{s.label}</span>
                <div className={`${s.cls} h-7 rounded-r`} style={{ width: `${s.width * 0.6}%` }} />
                <span className="tnum text-xs font-semibold text-ink">{fmt(s.value)}</span>
              </div>
            ))}
            {["Started", "Completed", "Certified"].map((label) => (
              <div key={label} className="flex items-center gap-3">
                <span className="w-24 text-right text-xs text-mute">{label}</span>
                <div className="h-7 w-[30%] rounded-r border border-dashed border-hair2 bg-paper" />
                <span className="text-xs text-mute">not yet measured in source data</span>
              </div>
            ))}
          </div>
        </Widget>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Widget
          title="Completions received over time"
          help="The actual completion records loaded so far, by completion date. A pilot slice, not a national trend."
          provenance={p.completionTrend.provenance}
        >
          {p.completionTrend.data.length ? (
            <EChart
              height={280}
              option={timeLineOption([
                {
                  name: "Completions",
                  color: "#9A6E20",
                  area: true,
                  points: p.completionTrend.data.map((d: { day: string; completions: number }) => [d.day, d.completions])
                }
              ])}
            />
          ) : (
            <UnavailableNote reason="No dated completion records in the current source data." />
          )}
        </Widget>

        <Widget
          title="Cohorts (live cohort sources)"
          help="Real cohort assignments from the cohort datasets; covers a partial record pool, not all learners."
          provenance={p.cohorts.provenance}
        >
          <div className="max-h-[280px] overflow-y-auto pr-3">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-paperalt text-mute">
                <tr className="border-b border-hair">
                  <th className="py-1.5 pr-2 font-medium">Cohort</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Records</th>
                  <th className="py-1.5 text-right font-medium">With gender</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {p.cohorts.data.map((x: { cohort: string; learners: number; gender_known: number }) => (
                  <tr key={x.cohort} className="border-b border-hair2">
                    <td className="py-1.5 pr-2 text-ink">{labelCase(x.cohort)}</td>
                    <td className="py-1.5 pr-2 text-right">{fmt(x.learners)}</td>
                    <td className="py-1.5 text-right">{fmt(x.gender_known)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Widget>
      </section>

      <Widget
        title="Course enrolment matrix"
        help="Every course with its enrolments and distinct learners, from actual training records. Completion and quiz columns will appear when national completion data lands."
        provenance={c.courses.provenance}
      >
        <div className="max-h-[360px] overflow-y-auto pr-3">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-paperalt text-mute">
              <tr className="border-b border-hair">
                <th className="py-1.5 pr-2 font-medium">Course</th>
                <th className="py-1.5 pr-2 font-medium">Category</th>
                <th className="py-1.5 pr-2 text-right font-medium">Enrolments</th>
                <th className="py-1.5 text-right font-medium">Learners</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {courses.map((x) => (
                <tr key={x.course} className="border-b border-hair2">
                  <td className="py-1.5 pr-2 text-ink">{labelCase(x.course)}</td>
                  <td className="py-1.5 pr-2 text-mute">{labelCase(x.category)}</td>
                  <td className="py-1.5 pr-2 text-right">{fmt(x.enrolments)}</td>
                  <td className="py-1.5 text-right">{fmt(x.learners)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Widget>
    </PageShell>
  );
}
