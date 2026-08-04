import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql, isUnfiltered } from "@/lib/filters-server";
import { fmt } from "@/lib/format";
import { nonBlankSql, personKeySql, PROGRAMME_DATASET_KEY, PROGRAMME_TABLE, trainingRecordSql } from "@/lib/source-sql";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return cachedJson(req, "pipeline", async () => {
  const registry = await getRegistry();
  const filters = readFilters(req);
  const params = filterValues(filters);
  const useSummary = isUnfiltered(filters);

  const [stages, completion, completionTrend, cohorts, dailyActivity] = await Promise.all([
    useSummary
      ? db.query(`SELECT registered, enrolled FROM analytics.dashboard_pipeline_summary_mv`)
      : db.query(
        `SELECT count(DISTINCT ${personKeySql("t")})::int AS registered,
              count(*)::int AS enrolled
       FROM ${PROGRAMME_TABLE} t
       WHERE ${trainingRecordSql("t")} AND ${filterSql("t")}`,
        params
      ),
    useSummary
      ? db.query(`SELECT records, avg_quiz, completed, first_date, last_date FROM analytics.dashboard_pipeline_summary_mv`)
      : db.query(`
      SELECT count(*)::int AS records,
             round(avg(quiz_average), 1)::float AS avg_quiz,
             count(*) FILTER (WHERE pct_complete >= 100 OR completion_date IS NOT NULL)::int AS completed,
             min(completion_date)::text AS first_date,
             max(completion_date)::text AS last_date
      FROM ${PROGRAMME_TABLE} t
      WHERE ${filterSql("t")} AND (t.pct_complete IS NOT NULL OR t.completion_date IS NOT NULL)`,
        params
      ),
    useSummary
      ? db.query(`SELECT day, completions FROM analytics.dashboard_completion_trend_mv ORDER BY day`)
      : db.query(`
      SELECT completion_date::text AS day, count(*)::int AS completions
      FROM ${PROGRAMME_TABLE} t
      WHERE ${filterSql("t")} AND completion_date IS NOT NULL
      GROUP BY 1 ORDER BY 1`,
        params
      ),
    useSummary
      ? db.query(`SELECT cohort, learners, gender_known FROM analytics.dashboard_cohort_summary_mv ORDER BY learners DESC LIMIT 15`)
      : db.query(`
      SELECT cohort, count(*)::int AS learners,
             count(*) FILTER (WHERE ${nonBlankSql("t.gender")})::int AS gender_known
      FROM ${PROGRAMME_TABLE} t
      WHERE ${filterSql("t")} AND ${nonBlankSql("t.cohort")}
      GROUP BY 1 ORDER BY learners DESC LIMIT 15`,
        params
      ),
    useSummary
      ? db.query(`SELECT day, enrolments, learners FROM analytics.dashboard_pipeline_daily_activity_mv ORDER BY day`)
      : db.query(
        `SELECT t.date_trained::text AS day, count(*)::int AS enrolments,
              count(DISTINCT ${personKeySql("t")})::int AS learners
       FROM ${PROGRAMME_TABLE} t
       WHERE ${trainingRecordSql("t")} AND ${filterSql("t")}
       GROUP BY 1 ORDER BY 1`,
        params
      )
  ]);

  const comp = completion.rows[0];

  return {
    widgets: {
      funnel: {
        data: {
          registered: stages.rows[0].registered,
          enrolled: stages.rows[0].enrolled,
          completion_records: comp.records
        },
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "partial",
          coverage: `Registered and enrolled are scoped to the Training, Ajira Portal and ICTA Standards streams; ${fmt(comp.records)} records have completion fields.`,
          note: "Started, completed and certified stages cannot be computed nationally from current source data."
        })
      },
      completionSummary: {
        data: comp,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "partial",
          coverage: `${fmt(comp.records)} records have completion fields in analytics.20_million_by_2032.`,
          note: "Completion fields are populated only on a small stream and are not representative of national completion."
        })
      },
      completionTrend: {
        data: completionTrend.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "partial",
          coverage: `${fmt(comp.records)} actual records with completion fields.`,
          note: "Pilot-slice completions only; not a national trend."
        })
      },
      cohorts: {
        data: cohorts.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "partial",
          note: "Cohort assignments come from the combined source where populated. Completion per cohort is not yet reliable nationally."
        })
      },
      dailyActivity: {
        data: dailyActivity.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Daily activity uses dated training partner records. Ajira Portal and ICTA Standards currently have no training dates."
        })
      }
    }
  };
  });
}
