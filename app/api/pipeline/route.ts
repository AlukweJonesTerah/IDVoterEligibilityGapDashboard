import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const params = filterValues(readFilters(req));

  const [funnel, byCohort, dropoffByCounty, completionTrend, dailyActivity] = await Promise.all([
    db.query(
      `SELECT count(DISTINCT e.unique_id)::int AS registered,
              count(*)::int AS enrolled,
              count(*) FILTER (WHERE e.status IN ('IN PROGRESS','COMPLETED'))::int AS started,
              count(*) FILTER (WHERE e.status = 'COMPLETED')::int AS completed,
              count(*) FILTER (WHERE e.certification_ready)::int AS certification_ready
       FROM sample.enrolment_outcomes e WHERE ${filterSql("e")}`,
      params
    ),
    db.query(
      `SELECT c.cohort, count(DISTINCT c.unique_id)::int AS learners,
              round(100.0 * count(*) FILTER (WHERE e.status = 'COMPLETED') /
                NULLIF(count(*) FILTER (WHERE e.status IN ('IN PROGRESS','COMPLETED')), 0), 1)::float AS completion_rate
       FROM sample.cohort_assignments c
       JOIN sample.enrolment_outcomes e USING (unique_id)
       WHERE ${filterSql("e")}
       GROUP BY c.cohort ORDER BY learners DESC LIMIT 15`,
      params
    ),
    db.query(
      `SELECT coalesce(c.county_name, initcap(e.county)) AS county,
              round(100.0 * count(*) FILTER (WHERE e.status = 'NOT STARTED') / NULLIF(count(*), 0), 1)::float AS dropoff_rate,
              count(*)::int AS enrolments
       FROM sample.enrolment_outcomes e
       LEFT JOIN ref.counties c ON ref.norm_county(c.county_name) = ref.norm_county(e.county)
       WHERE ${filterSql("e")}
       GROUP BY 1 HAVING count(*) > 100 ORDER BY dropoff_rate DESC LIMIT 12`,
      params
    ),
    db.query(
      `SELECT e.completion_date::text AS day, count(*)::int AS completions
       FROM sample.enrolment_outcomes e
       WHERE e.completion_date IS NOT NULL AND ${filterSql("e")}
       GROUP BY 1 ORDER BY 1`,
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

  const modeled = (note: string) =>
    provenanceFor(registry, ["training_records", "completion"], { totalsReal: false, note });

  return NextResponse.json({
    widgets: {
      funnel: {
        data: funnel.rows[0],
        provenance: provenanceFor(registry, ["training_records", "completion"], {
          note: "Registered and enrolled are actual; started, completed and certified stages are modeled pending Dataset 3."
        })
      },
      cohorts: {
        data: byCohort.rows,
        provenance: provenanceFor(registry, ["county_cohort", "completion"], {
          totalsReal: false,
          note: "Cohort structures are synthetic placeholders with systematic names, pending Datasets 5 and 6."
        })
      },
      dropoff: {
        data: dropoffByCounty.rows,
        provenance: modeled("Drop-off rates are modeled pending Dataset 3.")
      },
      completionTrend: {
        data: completionTrend.rows,
        provenance: modeled("Completion dates are modeled pending Dataset 3.")
      },
      dailyActivity: {
        data: dailyActivity.rows,
        provenance: provenanceFor(registry, ["training_records"])
      }
    }
  });
}
