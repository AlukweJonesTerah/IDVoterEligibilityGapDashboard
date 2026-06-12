"use client";

import { PageShell } from "@/components/dashboard/PageShell";
import { Widget, Kpi } from "@/components/dashboard/Widget";
import { useDashboardData, LoadingBlock } from "@/lib/useDashboardData";
import { fmt } from "@/lib/format";

const SOURCE_BADGE: Record<string, string> = {
  actual: "bg-icta-greenSoft text-icta-greenDeep",
  sample: "bg-[#F5EBD8] text-signal-gold",
  none: "bg-hair2 text-mute"
};

const SOURCE_LABEL: Record<string, string> = {
  actual: "loaded (actual)",
  sample: "modeled (sample)",
  none: "not loaded"
};

export default function QualityPage() {
  const { widgets: w, error } = useDashboardData("/api/quality");

  return (
    <PageShell
      title="Data Quality & Program Assurance"
      subtitle="Shows which datasets are loaded, which are modeled and which are still missing, with duplicate and completeness checks on the loaded data."
    >
      {!w ? (
        <LoadingBlock error={error} />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <Kpi label="Data quality score" value={`${w.metrics.data.quality_score} / 100`} provenance={w.metrics.provenance} />
            <Kpi label="Total records" value={fmt(w.metrics.data.total_rows)} provenance={w.metrics.provenance} />
            <Kpi label="Unique learners" value={fmt(w.metrics.data.unique_learners)} provenance={w.metrics.provenance} />
            <Kpi
              label="Duplicate learner IDs"
              value={fmt(w.metrics.data.duplicate_ids)}
              sub={`${fmt(w.metrics.data.duplicate_ids)} duplicate IDs across ${fmt(w.metrics.data.rows_on_duplicate_ids)} rows (${w.metrics.data.duplicate_rate}%)`}
              provenance={w.metrics.provenance}
            />
            <Kpi
              label="Missing fields"
              value={`${fmt(w.metrics.data.missing_county)} · ${fmt(w.metrics.data.missing_id)}`}
              sub={`Missing county: ${fmt(w.metrics.data.missing_county)} · Missing ID: ${fmt(w.metrics.data.missing_id)}`}
              provenance={w.metrics.provenance}
            />
          </section>

          <Widget title="Dataset registry: the source of truth for every widget" provenance={w.registry.provenance}>
            <table className="w-full text-left text-[12px]">
              <thead className="text-mute">
                <tr className="border-b border-hair">
                  <th className="py-1.5 pr-2 font-medium">Dataset</th>
                  <th className="py-1.5 pr-2 font-medium">Expected table</th>
                  <th className="py-1.5 pr-2 font-medium">Status</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Rows</th>
                  <th className="py-1.5 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {w.registry.data.map(
                  (r: {
                    dataset_key: string;
                    display_name: string;
                    expected_table: string;
                    active_source: string;
                    row_count: number | null;
                    notes: string | null;
                  }) => (
                    <tr key={r.dataset_key} className="border-b border-hair2 align-top">
                      <td className="py-2 pr-2 font-medium text-ink">{r.display_name}</td>
                      <td className="py-2 pr-2 font-mono text-[11px] text-subink">{r.expected_table}</td>
                      <td className="py-2 pr-2">
                        <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${SOURCE_BADGE[r.active_source]}`}>
                          {SOURCE_LABEL[r.active_source]}
                        </span>
                      </td>
                      <td className="tnum py-2 pr-2 text-right">{r.row_count ? fmt(r.row_count) : "—"}</td>
                      <td className="py-2 text-[11px] leading-4 text-mute">{r.notes}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </Widget>

          <Widget
            title="Placeholder-like fields in the loaded table"
            provenance={w.placeholders.provenance}
          >
            <table className="w-full max-w-2xl text-left text-[12px]">
              <thead className="text-mute">
                <tr className="border-b border-hair">
                  <th className="py-1.5 pr-2 font-medium">Field</th>
                  <th className="py-1.5 pr-2 text-right font-medium">Distinct values</th>
                  <th className="py-1.5 font-medium">Dominant value</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {w.placeholders.data.map((p: { field: string; distinct_values: number; dominant_value: string }) => (
                  <tr key={p.field} className="border-b border-hair2">
                    <td className="py-1.5 pr-2 font-mono text-[11px] text-ink">{p.field}</td>
                    <td className="py-1.5 pr-2 text-right">{p.distinct_values}</td>
                    <td className="py-1.5 text-mute">{p.dominant_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-mute">
              Fields with one repeated value across all records are treated as placeholders and excluded from
              analysis until the data team confirms their source.
            </p>
          </Widget>
        </>
      )}
    </PageShell>
  );
}
