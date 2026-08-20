"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi, HelpTip } from "@/components/dashboard/Widget";
import { UnavailableNote, ProvenanceDot } from "@/components/dashboard/Provenance";
import { EChart } from "@/components/charts/EChart";
import { KenyaMap } from "@/components/charts/KenyaMap";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { useFilters } from "@/components/dashboard/FilterContext";
import { chartMotion, chartPalette, axisStyle, donutOption } from "@/lib/charts/motion";
import { fmt, fmtCompact, fmtPct, labelCase } from "@/lib/format";

type RankedRow = {
  label: string;
  value: number;
  color?: string;
};

type PartnerComparisonRow = {
  partner: string;
  records: number;
};

type CourseCategoryRow = {
  course_category: string;
  enrolments: number;
};

const ICTA_STANDARDS_CATEGORIES = new Set([
  "systems and applications standard training",
  "it governance standard training",
  "information security standard training",
  "e-records management standards training"
]);

function consolidateStandardsCategories(rows: CourseCategoryRow[]): {
  rows: RankedRow[];
  standardsRecords: number;
  combined: boolean;
} {
  const standards = rows.filter((row) => ICTA_STANDARDS_CATEGORIES.has(row.course_category.trim().toLowerCase()));
  const regular = rows.filter((row) => !ICTA_STANDARDS_CATEGORIES.has(row.course_category.trim().toLowerCase()));
  const standardsRecords = standards.reduce((sum, row) => sum + row.enrolments, 0);
  const combined = standards.length > 1;
  const categoryRows = [
    ...regular.map((row) => ({ label: labelCase(row.course_category), value: row.enrolments })),
    ...(combined
      ? [{ label: "ICTA Standards training", value: standardsRecords }]
      : standards.map((row) => ({ label: labelCase(row.course_category), value: row.enrolments })))
  ].sort((a, b) => b.value - a.value);

  return { rows: categoryRows, standardsRecords, combined };
}

function RankedList({
  rows,
  color = "#007A3D",
  maxRows = 10
}: {
  rows: RankedRow[];
  color?: string;
  maxRows?: number;
}) {
  const shown = rows.slice(0, maxRows);
  const max = Math.max(...shown.map((row) => row.value), 1);

  return (
    <div className="flex flex-col gap-2.5">
      {shown.map((row) => (
        <div key={row.label} className="min-w-0">
          <div className="mb-1 flex items-baseline justify-between gap-3 text-[11px]">
            <span className="truncate text-subink" title={row.label}>
              {row.label}
            </span>
            <span className="tnum shrink-0 font-semibold text-ink">{fmt(row.value)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-sm bg-hair2">
            <div
              className="h-full rounded-sm"
              style={{ width: `${Math.max(2, (row.value / max) * 100)}%`, backgroundColor: row.color ?? color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function RankedTable({
  rows,
  rankStart = 1
}: {
  rows: RankedRow[];
  rankStart?: number;
}) {
  return (
    <div className="overflow-hidden rounded border border-hair2 lg:flex-1">
      <table className="w-full border-collapse text-left text-[11px] lg:h-full">
        <thead className="bg-canvas text-[10px] uppercase tracking-wide text-mute">
          <tr>
            <th className="w-9 px-2.5 py-2 font-semibold">Rank</th>
            <th className="px-2.5 py-2 font-semibold">County</th>
            <th className="px-2.5 py-2 text-right font-semibold">Learners</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.label} className="border-t border-hair2">
              <td className="tnum px-2.5 py-2 text-mute">{rankStart + index}</td>
              <td className="px-2.5 py-2 text-subink">{row.label}</td>
              <td className="tnum px-2.5 py-2 text-right font-semibold text-ink">{fmt(row.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProfileTable({ rows }: { rows: RankedRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;

  return (
    <div className="overflow-hidden rounded border border-hair2">
      <table className="w-full border-collapse text-left text-[11px]">
        <thead className="bg-canvas text-[10px] uppercase tracking-wide text-mute">
          <tr>
            <th className="px-2.5 py-2 font-semibold">Education level</th>
            <th className="px-2.5 py-2 text-right font-semibold">Records</th>
            <th className="px-2.5 py-2 text-right font-semibold">Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-hair2">
              <td className="px-2.5 py-2 text-subink">{row.label}</td>
              <td className="tnum px-2.5 py-2 text-right font-semibold text-ink">{fmt(row.value)}</td>
              <td className="tnum px-2.5 py-2 text-right text-subink">
                {((row.value / total) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ pct, color = "#00A651" }: { pct: number; color?: string }) {
  const width = Math.min(100, Math.max(pct > 0 ? 1.5 : 0, pct));
  return (
    <div className="h-6 w-full overflow-hidden rounded-sm bg-hair2">
      <div className="h-full rounded-sm" style={{ width: `${width}%`, backgroundColor: color }} />
    </div>
  );
}

function StackedBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-sm">
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} />
        ))}
      </div>
      <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-subink">
        {segments.map((s) => (
          <span key={s.label} className="inline-flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label} · {Math.round((s.value / total) * 100)}%
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ExecutiveOverview() {
  const { widgets: w, error } = useDashboardData("/api/overview");
  const { filters, setFilters } = useFilters();
  const partnerRows: PartnerComparisonRow[] = w?.partnerComparison.data ?? [];
  const smallestPartnerValue = Math.min(
    ...partnerRows.map((row) => row.records).filter((value) => value > 0),
    100
  );
  const partnerAxisMin = smallestPartnerValue >= 100 ? 100 : smallestPartnerValue >= 10 ? 10 : 1;
  const categorySummary = consolidateStandardsCategories(w?.categories.data ?? []);

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
              label="Total learners"
              help="All training enrolments recorded in the current filter scope. A learner who took more than one course is counted once per course."
              value={fmt(w.headline.data.enrolments)}
              sub="trained across all programmes"
              provenance={w.headline.provenance}
            />
            <Kpi
              label="Progress to 20M"
              help="Total learners as a share of the national target of 20 million Kenyans skilled by 2032."
              value={fmtPct(w.headline.data.progressPct)}
              sub={`of the ${fmtCompact(w.headline.data.target)} target`}
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
              label="Youth (18-34)"
              help="Share aged 18 to 34 among pooled records with a known age group."
              value={fmtPct(w.inclusion.data.youth_rate)}
              provenance={incProv(`Age group known for ${fmt(w.inclusion.data.age_known)} of ${fmt(w.inclusion.data.persons)} pooled records. Bands harmonized from inconsistent source buckets into standard ranges.`)}
            />
            <Kpi
              label="Persons with disability"
              help="Pooled records reporting a disability, of those with a disability response."
              value={w.inclusion.data.disability_known > 0 ? fmt(w.inclusion.data.pwd_learners) : "—"}
              provenance={incProv(`Disability response recorded for ${fmt(w.inclusion.data.disability_known)} of ${fmt(w.inclusion.data.persons)} pooled records.`)}
            />
            <article className="col-span-2 rounded border border-hair bg-paperalt px-4 py-3 shadow-card lg:col-span-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow">Progress to 20M covered</span>
                    <HelpTip text="Total learners as a share of the national target of 20 million Kenyans skilled by 2032." />
                    <ProvenanceDot provenance={w.headline.provenance} />
                  </div>
                  <div className="mt-2.5">
                    <ProgressBar pct={w.headline.data.progressPct} />
                    <div className="mt-1.5 text-[11px] text-subink">
                      {fmt(w.headline.data.enrolments)} of {fmt(w.headline.data.target)} ·{" "}
                      <span className="font-semibold text-ink">{fmtPct(w.headline.data.progressPct)}</span> covered
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="eyebrow">Gender split</span>
                    <HelpTip text="Gender split among pooled records with a known gender." />
                    <ProvenanceDot provenance={w.genderSplit.provenance} />
                  </div>
                  <div className="mt-2.5">
                    {w.genderSplit.data.some((d: { learners: number }) => d.learners > 0) ? (
                      <StackedBar
                        segments={w.genderSplit.data.map((d: { gender: string; learners: number }, index: number) => ({
                          label: labelCase(d.gender),
                          value: d.learners,
                          color: index === 0 ? "#00522A" : "#00A651"
                        }))}
                      />
                    ) : (
                      <p className="text-[11px] text-mute">No gender records for the current filter.</p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          </section>

          <Widget
            title="Records by training partner"
            help="Total records for each training partner. Use the Source filter to inspect programme streams within a partner."
            provenance={w.partnerComparison.provenance}
          >
            <EChart
              height={280}
              mobileHeight={300}
              option={{
                ...chartMotion,
                aria: { enabled: true },
                animationDelay: (idx: number) => idx * 18,
                animationDelayUpdate: (idx: number) => idx * 8,
                grid: { left: 8, right: 72, top: 12, bottom: 8, containLabel: true },
                tooltip: {
                  trigger: "axis",
                  axisPointer: { type: "shadow" },
                  valueFormatter: (value: number) => fmt(value)
                },
                xAxis: {
                  type: "log",
                  logBase: 10,
                  min: partnerAxisMin,
                  ...axisStyle,
                  axisLabel: { ...axisStyle.axisLabel, formatter: (value: number) => fmtCompact(value) }
                },
                yAxis: {
                  type: "category",
                  inverse: true,
                  data: partnerRows.map((row) => row.partner),
                  ...axisStyle,
                  axisLabel: { ...axisStyle.axisLabel, width: 120, overflow: "truncate" }
                },
                series: [
                  {
                    name: "Records",
                    type: "bar",
                    barMaxWidth: 16,
                    itemStyle: { color: "#007A3D", borderRadius: [0, 2, 2, 0] },
                    label: {
                      show: true,
                      position: "right",
                      color: "#3A4856",
                      fontSize: 11,
                      formatter: ({ value }: { value: number }) => fmt(value)
                    },
                    data: partnerRows.map((row) => ({
                      name: row.partner,
                      value: row.records,
                      itemStyle: { opacity: !filters.partner || filters.partner === row.partner ? 1 : 0.28 }
                    }))
                  }
                ]
              }}
              onEvents={{
                click: (params: { name?: string }) => {
                  if (params.name) setFilters({ partner: filters.partner === params.name ? null : params.name });
                }
              }}
            />
            <p className="mt-1 text-[11px] text-mute">Logarithmic scale keeps smaller partners visible. Click a bar to filter every page, or use Source to inspect a programme stream.</p>
          </Widget>

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
              {w.age.data.length ? (
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
                        itemStyle: { color: "#007A3D", borderRadius: [2, 2, 0, 0] },
                        data: w.age.data.map((d: { learners: number }) => d.learners)
                      }
                    ]
                  }}
                />
              ) : (
                <UnavailableNote reason="No age-group records are available for the current filters." />
              )}
            </Widget>
            <Widget title="Disability inclusion" help="Pooled records with a disability response: reported disability versus none." provenance={w.disability.provenance}>
              {w.disability.data.length ? (
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
              ) : (
                <UnavailableNote reason="No disability supplement records are available for the current county filter. This is partial source coverage, not a zero-disability result." />
              )}
            </Widget>
          </section>

          {/* County league table + course-category mix */}
          <section className="grid gap-4 lg:grid-cols-3">
            <Widget
              className="lg:col-span-2 lg:flex lg:flex-col"
              title="County rankings"
              help="Counties ranked by unique learners in the current filter scope. Most reached on the left, least reached on the right."
              provenance={w.countyMap.provenance}
            >
              <div className="grid gap-x-8 gap-y-5 md:grid-cols-2 lg:flex-1">
                <div className="lg:flex lg:flex-col">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Most reached
                  </div>
                  <RankedTable
                    rows={w.countyMap.data.slice(0, 5).map((d: { county_label: string; learners: number }) => ({
                      label: d.county_label,
                      value: d.learners
                    }))}
                  />
                </div>
                <div className="lg:flex lg:flex-col">
                  <div className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink">
                    Least reached
                  </div>
                  <RankedTable
                    rankStart={Math.max(1, w.countyMap.data.length - 4)}
                    rows={w.countyMap.data
                      .slice(-5)
                      .map((d: { county_label: string; learners: number }) => ({
                        label: d.county_label,
                        value: d.learners
                      }))}
                  />
                </div>
              </div>
            </Widget>
            <Widget
              title="Course categories"
              help="Share of training-stream records across course categories. ICTA Standards categories are combined here to keep the overview readable."
              provenance={w.categories.provenance}
            >
              <EChart
                height={300}
                mobileHeight={250}
                option={donutOption(
                  categorySummary.rows.map((row) => ({ name: row.label, value: row.value })),
                  chartPalette
                )}
              />
              {categorySummary.combined ? (
                <p className="mt-1 text-[11px] text-mute">
                  ICTA Standards training combines four categories with {fmt(categorySummary.standardsRecords)} records. Select ICTA Standards or a category above for detail.
                </p>
              ) : null}
            </Widget>
          </section>

          {/* Course leaderboard + learner profile */}
          <section className="grid gap-4 lg:grid-cols-3">
            <Widget
              className="lg:col-span-2"
              title={`Course leaderboard (${fmt(w.headline.data.courses)})`}
              help="Top courses by training-stream enrolments in the current filter scope."
              provenance={w.courseLeaderboard.provenance}
            >
              <RankedList
                maxRows={10}
                color="#007A3D"
                rows={w.courseLeaderboard.data
                  .slice(0, 10)
                  .map((d: { course: string | null; enrolments: number }) => ({
                    label: labelCase(d.course ?? "Unspecified"),
                    value: d.enrolments
                  }))}
              />
            </Widget>
            <Widget
              title="Learner profile"
              help="Reported education level, from the partial demographic source pool."
              provenance={w.education.provenance}
            >
              {w.education.data.length ? (
                <ProfileTable
                  rows={w.education.data.slice(0, 6).map((d: { label: string; learners: number }) => ({
                    label: labelCase(d.label),
                    value: d.learners
                  }))}
                />
              ) : (
                <p className="text-[11px] text-mute">No education-level records for the current filter.</p>
              )}
            </Widget>
          </section>
        </>
      )}
    </PageShell>
  );
}
