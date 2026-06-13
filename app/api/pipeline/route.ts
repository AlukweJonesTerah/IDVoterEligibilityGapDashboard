import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import {
  readFilters,
  filterValues,
  filterSql,
  demographicPoolFilterSql,
  partialPoolFilterNote
} from "@/lib/filters-server";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const filters = readFilters(req);
  const params = filterValues(filters);
  const unsupportedPartialFilters = partialPoolFilterNote(filters);

  const [stages, completion, completionTrend, cohorts, dailyActivity] = await Promise.all([
    db.query(
      `SELECT count(DISTINCT t.unique_id)::int AS registered,
              count(*)::int AS enrolled
       FROM analytics.icta_training_data t WHERE ${filterSql("t")}`,
      params
    ),
    db.query(`
      SELECT count(*)::int AS records,
             round(avg(quiz_average), 1)::float AS avg_quiz,
             count(*) FILTER (WHERE percent_complete >= 100)::int AS completed,
             min(completion_date)::text AS first_date,
             max(completion_date)::text AS last_date
      FROM staging.completion_records`),
    db.query(`
      SELECT completion_date::text AS day, count(*)::int AS completions
      FROM staging.completion_records WHERE completion_date IS NOT NULL
      GROUP BY 1 ORDER BY 1`),
    db.query(`
      SELECT cohort, count(*)::int AS learners,
             count(gender)::int AS gender_known
      FROM staging.demographic_persons d
      WHERE d.cohort IS NOT NULL AND ${demographicPoolFilterSql("d")}
      GROUP BY 1 ORDER BY learners DESC LIMIT 15`,
      params
    ),
    db.query(
      `SELECT t.date_trained::text AS day, count(*)::int AS enrolments,
              count(DISTINCT t.unique_id)::int AS learners
       FROM analytics.icta_training_data t WHERE ${filterSql("t")}
       GROUP BY 1 ORDER BY 1`,
      params
    )
  ]);

  const comp = completion.rows[0];

  return NextResponse.json({
    widgets: {
      funnel: {
        data: {
          registered: stages.rows[0].registered,
          enrolled: stages.rows[0].enrolled,
          completion_records: comp.records
        },
        provenance: provenanceFor(registry, ["training_records", "completion"], {
          status: "partial",
          coverage: `Registered and enrolled are actual; only ${fmt(comp.records)} actual completion records exist.`,
          note: "Started, completed and certified stages cannot be computed nationally from current source data."
        })
      },
      completionSummary: {
        data: comp,
        provenance: provenanceFor(registry, ["completion"], {
          status: "partial",
          coverage: `${fmt(comp.records)} actual completion records loaded; not representative of national completion.`,
          note: "Pilot-slice data from the completion source."
        })
      },
      completionTrend: {
        data: completionTrend.rows,
        provenance: provenanceFor(registry, ["completion"], {
          status: "partial",
          coverage: `${fmt(comp.records)} actual completion records.`,
          note: "Pilot-slice completions only; not a national trend."
        })
      },
      cohorts: {
        data: cohorts.rows,
        provenance: provenanceFor(registry, ["county_cohort", "busia_cohort"], {
          status: "partial",
          note: `Real cohort assignments from the cohort sources; covers a partial record pool, not all learners. County filters apply where source records carry county. Completion per cohort is not yet in the source data.${unsupportedPartialFilters ? ` ${unsupportedPartialFilters}` : ""}`
        })
      },
      dailyActivity: {
        data: dailyActivity.rows,
        provenance: provenanceFor(registry, ["training_records"])
      }
    }
  });
}
