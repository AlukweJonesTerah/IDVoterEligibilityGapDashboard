import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const registry = await getRegistry();

  const [metrics, placeholders, registryRows] = await Promise.all([
    db.query(`
      WITH dups AS (
        SELECT unique_id, count(*) AS n FROM analytics.icta_training_data
        GROUP BY unique_id HAVING count(*) > 1
      )
      SELECT (SELECT count(*) FROM analytics.icta_training_data)::int AS total_rows,
             (SELECT count(DISTINCT unique_id) FROM analytics.icta_training_data)::int AS unique_learners,
             (SELECT count(*) FROM dups)::int AS duplicate_ids,
             (SELECT coalesce(sum(n), 0) FROM dups)::int AS rows_on_duplicate_ids,
             (SELECT count(*) FROM analytics.icta_training_data WHERE county IS NULL OR county = '')::int AS missing_county,
             (SELECT count(*) FROM analytics.icta_training_data WHERE unique_id IS NULL OR unique_id = '')::int AS missing_id`),
    db.query(`
      SELECT 'institution' AS field, count(DISTINCT institution)::int AS distinct_values,
             max(institution) AS dominant_value FROM analytics.icta_training_data
      UNION ALL
      SELECT 'institution_level', count(DISTINCT institution_level), max(institution_level)
      FROM analytics.icta_training_data
      UNION ALL
      SELECT 'trainer_level', count(DISTINCT trainer_level), max(trainer_level)
      FROM analytics.icta_training_data
      UNION ALL
      SELECT 'training_location', count(DISTINCT training_location), max(training_location)
      FROM analytics.icta_training_data`),
    db.query(`
      SELECT dataset_key, display_name, expected_table, active_source,
             loaded_at::text, row_count, notes
      FROM app.dataset_registry
      ORDER BY CASE active_source WHEN 'actual' THEN 0 WHEN 'sample' THEN 1 ELSE 2 END, dataset_key`)
  ]);

  const m = metrics.rows[0];
  // Score: completeness of key fields minus duplicate pressure, per plan §Page 10.
  const dupRate = m.rows_on_duplicate_ids / m.total_rows;
  const missRate = (m.missing_county + m.missing_id) / (m.total_rows * 2);
  const score = Math.round(100 - dupRate * 100 * 0.5 - missRate * 100);

  return NextResponse.json({
    widgets: {
      metrics: {
        data: { ...m, duplicate_rate: Number((dupRate * 100).toFixed(2)), quality_score: score },
        provenance: provenanceFor(registry, ["training_records"])
      },
      placeholders: {
        data: placeholders.rows,
        provenance: provenanceFor(registry, ["training_records"], {
          note: "Fields with a single repeated value are flagged as placeholders pending source confirmation."
        })
      },
      registry: {
        data: registryRows.rows,
        provenance: provenanceFor(registry, ["training_records"])
      }
    }
  });
}
