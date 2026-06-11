import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const county = req.nextUrl.searchParams.get("county");

  const [byCounty, regionDrill] = await Promise.all([
    db.query(`
      SELECT t.county,
             coalesce(c.county_name, initcap(t.county)) AS county_label,
             count(DISTINCT t.unique_id)::int AS learners,
             count(*)::int AS enrolments,
             c.population_2019::int AS population,
             round(100000.0 * count(DISTINCT t.unique_id) / c.population_2019, 1)::float AS per_100k,
             o.completion_rate,
             a.female_rate, a.pwd_learners
      FROM analytics.icta_training_data t
      LEFT JOIN ref.counties c ON ref.norm_county(c.county_name) = ref.norm_county(t.county)
      LEFT JOIN LATERAL (
        SELECT round(100.0 * count(*) FILTER (WHERE status = 'COMPLETED') / count(*), 1)::float AS completion_rate
        FROM sample.enrolment_outcomes e WHERE e.county = t.county
      ) o ON true
      LEFT JOIN LATERAL (
        SELECT round(100.0 * count(*) FILTER (WHERE gender = 'FEMALE') / count(*), 1)::float AS female_rate,
               count(*) FILTER (WHERE has_disability)::int AS pwd_learners
        FROM sample.learner_attributes la WHERE la.county = t.county
      ) a ON true
      GROUP BY t.county, c.county_name, c.population_2019, o.completion_rate, a.female_rate, a.pwd_learners
      ORDER BY learners DESC`),
    county
      ? db.query(
          `SELECT region, count(DISTINCT unique_id)::int AS learners, count(*)::int AS enrolments
           FROM analytics.icta_training_data WHERE ref.norm_county(county) = ref.norm_county($1)
           GROUP BY region ORDER BY learners DESC`,
          [county]
        )
      : Promise.resolve(null)
  ]);

  return NextResponse.json({
    widgets: {
      counties: {
        data: byCounty.rows,
        provenance: provenanceFor(registry, ["training_records", "completion", "baseline"], {
          note: "Learner counts and per-capita reach are actual; completion and inclusion columns are modeled."
        })
      },
      ...(regionDrill
        ? {
            regions: {
              data: regionDrill.rows,
              provenance: provenanceFor(registry, ["training_records"])
            }
          }
        : {})
    }
  });
}
