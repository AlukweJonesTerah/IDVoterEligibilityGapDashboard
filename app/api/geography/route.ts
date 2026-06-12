import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const filters = readFilters(req);
  // The county map and table always show all counties in scope; the global
  // county filter drives the drilldown instead of collapsing the page to one
  // row, so it is not applied to the per-county aggregates here.
  const params = filterValues({ ...filters, county: null });
  const drillCounty = req.nextUrl.searchParams.get("county") || filters.county;

  const [byCounty, regionDrill] = await Promise.all([
    db.query(
      `SELECT t.county,
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
         SELECT round(100.0 * count(*) FILTER (WHERE e.status = 'COMPLETED') /
                NULLIF(count(*) FILTER (WHERE e.status IN ('IN PROGRESS','COMPLETED')), 0), 1)::float AS completion_rate
         FROM sample.enrolment_outcomes e
         WHERE e.county = t.county
           AND ($2::text IS NULL OR e.course_category = $2::text)
           AND ($3::date IS NULL OR e.date_trained >= $3::date)
           AND ($4::date IS NULL OR e.date_trained <= $4::date)
       ) o ON true
       LEFT JOIN LATERAL (
         SELECT round(100.0 * count(*) FILTER (WHERE la.gender = 'FEMALE') / NULLIF(count(*), 0), 1)::float AS female_rate,
                count(*) FILTER (WHERE la.has_disability)::int AS pwd_learners
         FROM sample.learner_attributes la WHERE la.county = t.county
       ) a ON true
       WHERE ${filterSql("t")}
       GROUP BY t.county, c.county_name, c.population_2019, o.completion_rate, a.female_rate, a.pwd_learners
       ORDER BY learners DESC`,
      params
    ),
    drillCounty
      ? db.query(
          `SELECT t.region, count(DISTINCT t.unique_id)::int AS learners, count(*)::int AS enrolments
           FROM analytics.icta_training_data t
           WHERE ref.norm_county(t.county) = ref.norm_county($5::text) AND ${filterSql("t")}
           GROUP BY t.region ORDER BY learners DESC`,
          [...params, drillCounty]
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
