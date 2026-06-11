"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { EChart } from "@/components/charts/EChart";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { chartMotion, rankedBarMotion, chartPalette, axisStyle } from "@/lib/charts/motion";
import { fmt, fmtPct } from "@/lib/format";

interface CourseRow {
  course: string;
  category: string;
  enrolments: number;
  learners: number;
  completion_rate: number | null;
  avg_quiz: number | null;
}

const toTitle = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export default function CoursesPage() {
  const { widgets: w, error } = useDashboardData("/api/courses");

  if (!w) {
    return (
      <PageShell title="Course Performance">
        <LoadingBlock error={error} />
      </PageShell>
    );
  }

  const courses: CourseRow[] = w.courses.data;
  const top = courses[0];
  const bestCompletion = [...courses].sort((a, b) => (b.completion_rate ?? 0) - (a.completion_rate ?? 0))[0];

  return (
    <PageShell
      title="Course Performance"
      subtitle="What learners are taking and finishing. Enrolments are actual; completion and quiz figures are modeled pending the assessment dataset."
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Courses offered" value={String(courses.length)} provenance={w.courses.provenance} />
        <Kpi label="Most popular" value={top?.course ?? "—"} sub={`${fmt(top?.enrolments)} enrolments`} provenance={w.courses.provenance} />
        <Kpi
          label="Best completion"
          value={bestCompletion?.course ?? "—"}
          sub={fmtPct(bestCompletion?.completion_rate)}
          provenance={w.courses.provenance}
        />
        <Kpi
          label="Categories"
          value={String(w.categories.data.length)}
          sub={w.categories.data.map((c: { category: string }) => toTitle(c.category)).join(" · ")}
          provenance={w.categories.provenance}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Widget title="Course leaderboard (enrolments)" provenance={w.courses.provenance} className="lg:col-span-2">
          <EChart
            height={420}
            option={{
              ...rankedBarMotion,
              grid: { left: 220, right: 40, top: 8, bottom: 24 },
              tooltip: { trigger: "axis" },
              xAxis: { type: "value", ...axisStyle },
              yAxis: {
                type: "category",
                inverse: true,
                data: courses.slice(0, 15).map((c) => c.course),
                ...axisStyle,
                axisLabel: { ...axisStyle.axisLabel, fontSize: 10.5 }
              },
              series: [
                {
                  type: "bar",
                  barWidth: 12,
                  itemStyle: { color: "#ED1C24", borderRadius: [0, 2, 2, 0] },
                  data: courses.slice(0, 15).map((c) => c.enrolments)
                }
              ]
            }}
          />
        </Widget>

        <Widget title="Category mix" provenance={w.categories.provenance}>
          <EChart
            height={420}
            option={{
              ...chartMotion,
              tooltip: { trigger: "item" },
              color: chartPalette,
              legend: { bottom: 0, textStyle: { fontSize: 10.5, color: "#3A4856" } },
              series: [
                {
                  type: "pie",
                  radius: ["40%", "65%"],
                  center: ["50%", "45%"],
                  label: { fontSize: 11, color: "#3A4856", formatter: "{d}%" },
                  data: w.categories.data.map((d: { category: string; enrolments: number }) => ({
                    name: toTitle(d.category),
                    value: d.enrolments
                  }))
                }
              ]
            }}
          />
        </Widget>
      </section>

      <Widget title="Course performance matrix" provenance={w.courses.provenance}>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="sticky top-0 bg-paperalt text-mute">
              <tr className="border-b border-hair">
                <th className="py-1.5 pr-2 font-medium">Course</th>
                <th className="py-1.5 pr-2 font-medium">Category</th>
                <th className="py-1.5 pr-2 text-right font-medium">Enrolments</th>
                <th className="py-1.5 pr-2 text-right font-medium">Learners</th>
                <th className="py-1.5 pr-2 text-right font-medium">Completion*</th>
                <th className="py-1.5 text-right font-medium">Avg quiz*</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {courses.map((c) => (
                <tr key={c.course} className="border-b border-hair2">
                  <td className="py-1.5 pr-2 text-ink">{c.course}</td>
                  <td className="py-1.5 pr-2 text-mute">{toTitle(c.category)}</td>
                  <td className="py-1.5 pr-2 text-right">{fmt(c.enrolments)}</td>
                  <td className="py-1.5 pr-2 text-right">{fmt(c.learners)}</td>
                  <td className="py-1.5 pr-2 text-right">{fmtPct(c.completion_rate)}</td>
                  <td className="py-1.5 text-right">{c.avg_quiz ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[10.5px] text-mute">* modeled estimate pending the course completion dataset</p>
        </div>
      </Widget>
    </PageShell>
  );
}
