import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const registry = await getRegistry();

  const [funnel, byCohort, dropoffByCounty, completionTrend] = await Promise.all([
    db.query(`
      SELECT count(DISTINCT unique_id)::int AS registered,
             count(*)::int AS enrolled,
             count(*) FILTER (WHERE status IN ('IN PROGRESS','COMPLETED'))::int AS started,
             count(*) FILTER (WHERE status = 'COMPLETED')::int AS completed,
             count(*) FILTER (WHERE certification_ready)::int AS certification_ready
      FROM sample.enrolment_outcomes`),
    db.query(`
      SELECT c.cohort, count(DISTINCT c.unique_id)::int AS learners,
             round(100.0 * count(*) FILTER (WHERE e.status = 'COMPLETED') / count(*), 1)::float AS completion_rate
      FROM sample.cohort_assignments c
      JOIN sample.enrolment_outcomes e USING (unique_id)
      GROUP BY c.cohort ORDER BY learners DESC LIMIT 15`),
    db.query(`
      SELECT initcap(county) AS county,
             round(100.0 * count(*) FILTER (WHERE status = 'NOT STARTED') / count(*), 1)::float AS dropoff_rate,
             count(*)::int AS enrolments
      FROM sample.enrolment_outcomes
      GROUP BY county HAVING count(*) > 300 ORDER BY dropoff_rate DESC LIMIT 12`),
    db.query(`
      SELECT completion_date::text AS day, count(*)::int AS completions
      FROM sample.enrolment_outcomes WHERE completion_date IS NOT NULL
      GROUP BY 1 ORDER BY 1`)
  ]);

  const modeled = (note: string) =>
    provenanceFor(registry, ["training_records", "completion"], { totalsReal: false, note });

  return NextResponse.json({
    widgets: {
      funnel: {
        data: funnel.rows[0],
        provenance: provenanceFor(registry, ["training_records", "completion"], {
          note: "Registered and enrolled are actual; started/completed/certified stages are modeled pending Dataset 3."
        })
      },
      cohorts: {
        data: byCohort.rows,
        provenance: provenanceFor(registry, ["county_cohort", "completion"], {
          totalsReal: false,
          note: "Cohort structures are synthetic placeholders with systematic names, pending Datasets 5/6."
        })
      },
      dropoff: {
        data: dropoffByCounty.rows,
        provenance: modeled("Drop-off rates are modeled pending Dataset 3.")
      },
      completionTrend: {
        data: completionTrend.rows,
        provenance: modeled("Completion dates are modeled pending Dataset 3.")
      }
    }
  });
}
