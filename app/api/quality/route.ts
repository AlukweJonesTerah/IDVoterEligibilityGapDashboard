import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { kenyaCountyValuesSql, nonBlankSql, personKeySql, PROGRAMME_DATASET_KEY, PROGRAMME_TABLE } from "@/lib/source-sql";

export const dynamic = "force-dynamic";

export async function GET() {
  const registry = await getRegistry();

  const [metrics, placeholders, registryRows] = await Promise.all([
    db.query(`
      WITH dups AS (
        SELECT ${personKeySql("t")} AS person_key, count(*) AS n
        FROM ${PROGRAMME_TABLE} t
        GROUP BY 1 HAVING count(*) > 1
      )
      SELECT (SELECT count(*) FROM ${PROGRAMME_TABLE})::int AS total_rows,
             (SELECT count(DISTINCT ${personKeySql("t")}) FROM ${PROGRAMME_TABLE} t)::int AS unique_learners,
             (SELECT count(*) FROM dups)::int AS duplicate_ids,
             (SELECT coalesce(sum(n), 0) FROM dups)::int AS rows_on_duplicate_ids,
             (SELECT count(*)
              FROM ${PROGRAMME_TABLE} t
              LEFT JOIN ${kenyaCountyValuesSql("kc")} ON kc.county_norm = regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g')
              WHERE NOT (${nonBlankSql("t.county")}) OR kc.county_norm IS NULL)::int AS missing_county,
             (SELECT count(*) FROM ${PROGRAMME_TABLE} t
              WHERE NOT (${nonBlankSql("t.national_id")})
                AND NOT (${nonBlankSql("t.phone_number")})
                AND NOT (${nonBlankSql("t.email")})
                AND NOT (${nonBlankSql("t.survey_uuid")}))::int AS missing_id`),
    db.query(`
      SELECT 'institution' AS field, count(DISTINCT institution)::int AS distinct_values,
             max(institution) AS dominant_value FROM ${PROGRAMME_TABLE}
      UNION ALL
      SELECT 'institution_level', count(DISTINCT institution_level), max(institution_level)
      FROM ${PROGRAMME_TABLE}
      UNION ALL
      SELECT 'trainer_level', count(DISTINCT trainer_level), max(trainer_level)
      FROM ${PROGRAMME_TABLE}
      UNION ALL
      SELECT 'where_course_taken', count(DISTINCT where_course_taken), max(where_course_taken)
      FROM ${PROGRAMME_TABLE}
      UNION ALL
      SELECT 'cdc_name', count(DISTINCT cdc_name), max(cdc_name)
      FROM ${PROGRAMME_TABLE}`),
    db.query(`
      WITH totals AS (
        SELECT count(*)::int AS total_rows FROM ${PROGRAMME_TABLE}
      ),
      stream_rows AS (
        SELECT source, count(*)::int AS row_count
        FROM ${PROGRAMME_TABLE}
        GROUP BY source
      ),
      coverage AS (
        SELECT 'gender' AS field, count(*) FILTER (WHERE ${nonBlankSql("t.gender")})::int AS n FROM ${PROGRAMME_TABLE} t
        UNION ALL SELECT 'age_group', count(*) FILTER (WHERE ${nonBlankSql("t.age_group")})::int FROM ${PROGRAMME_TABLE} t
        UNION ALL SELECT 'county', count(*) FILTER (WHERE ${nonBlankSql("t.county")})::int FROM ${PROGRAMME_TABLE} t
        UNION ALL SELECT 'disability_status', count(*) FILTER (WHERE ${nonBlankSql("t.disability_status")})::int FROM ${PROGRAMME_TABLE} t
        UNION ALL SELECT 'education_level', count(*) FILTER (WHERE ${nonBlankSql("t.education_level")})::int FROM ${PROGRAMME_TABLE} t
        UNION ALL SELECT 'course_category', count(*) FILTER (WHERE ${nonBlankSql("t.course_category")})::int FROM ${PROGRAMME_TABLE} t
        UNION ALL SELECT 'completion_fields', count(*) FILTER (WHERE t.pct_complete IS NOT NULL OR t.completion_date IS NOT NULL)::int FROM ${PROGRAMME_TABLE} t
      )
      SELECT lower(source) AS dataset_key,
             source || ' stream' AS display_name,
             'analytics."20_million_by_2032"' AS expected_table,
             'actual' AS active_source,
             NULL::text AS loaded_at,
             row_count,
             'Source stream inside the combined 20 million by 2032 table.' AS notes,
             row_count AS coverage_count,
             (SELECT total_rows FROM totals) AS coverage_denominator,
             'Rows from this stream within the combined table.' AS coverage_note
      FROM stream_rows
      UNION ALL
      SELECT 'field_' || field AS dataset_key,
             field || ' coverage' AS display_name,
             'analytics."20_million_by_2032".' || field AS expected_table,
             CASE WHEN n = (SELECT total_rows FROM totals) THEN 'actual' ELSE 'partial' END AS active_source,
             NULL::text AS loaded_at,
             n AS row_count,
             'Field-level completeness in the combined table.' AS notes,
             n AS coverage_count,
             (SELECT total_rows FROM totals) AS coverage_denominator,
             'Non-empty values / total rows.' AS coverage_note
      FROM coverage
      ORDER BY dataset_key`)
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
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY])
      },
      placeholders: {
        data: placeholders.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Fields with a single repeated value are flagged as placeholders pending source confirmation."
        })
      },
      registry: {
        data: registryRows.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Runtime registry derived directly from analytics.20_million_by_2032."
        })
      }
    }
  });
}
