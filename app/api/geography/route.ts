import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const filters = readFilters(req);
  // The county map and table always show all counties in scope; the global
  // county filter drives the drilldown instead of collapsing the page.
  const params = filterValues({ ...filters, county: null });
  const drillCounty = req.nextUrl.searchParams.get("county") || filters.county;

  const [byCounty, regionDrill] = await Promise.all([
    db.query(
      `SELECT t.county,
              coalesce(c.county_name, initcap(t.county)) AS county_label,
              count(DISTINCT t.unique_id)::int AS learners,
              count(*)::int AS enrolments,
              c.population_2019::int AS population,
              round(100000.0 * count(DISTINCT t.unique_id) / c.population_2019, 1)::float AS per_100k
       FROM analytics.icta_training_data t
       LEFT JOIN ref.counties c ON ref.norm_county(c.county_name) = ref.norm_county(t.county)
       WHERE ${filterSql("t")}
       GROUP BY t.county, c.county_name, c.population_2019
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
        provenance: provenanceFor(registry, ["training_records"], {
          note: "Learner counts and per-capita reach come from actual live training records. Completion and demographic columns are omitted until source coverage exists."
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
