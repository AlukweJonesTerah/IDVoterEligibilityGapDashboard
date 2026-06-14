import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";
import { kenyaCountyValuesSql, personKeySql, PROGRAMME_DATASET_KEY, PROGRAMME_TABLE } from "@/lib/source-sql";

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
      `SELECT kc.county_name AS county,
              kc.county_name AS county_label,
              count(DISTINCT ${personKeySql("t")})::int AS learners,
              count(*)::int AS enrolments,
              NULL::int AS population,
              NULL::float AS per_100k
       FROM ${PROGRAMME_TABLE} t
       JOIN ${kenyaCountyValuesSql("kc")} ON kc.county_norm = regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g')
       WHERE ${filterSql("t")}
       GROUP BY kc.county_name
       ORDER BY learners DESC`,
      params
    ),
    drillCounty
      ? db.query(
          `SELECT coalesce(nullif(trim(t.region), ''), nullif(trim(t.sub_county), ''), 'Unknown') AS region,
                  count(DISTINCT ${personKeySql("t")})::int AS learners,
                  count(*)::int AS enrolments
           FROM ${PROGRAMME_TABLE} t
           WHERE ${filterSql("t")}
             AND regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g') =
                 regexp_replace(lower(coalesce($5::text, '')), '[^a-z0-9]+', '', 'g')
           GROUP BY 1 ORDER BY learners DESC`,
          [...params, drillCounty]
        )
      : Promise.resolve(null)
  ]);

  return NextResponse.json({
    widgets: {
      counties: {
        data: byCounty.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Learner counts come from analytics.20_million_by_2032. Per-capita reach is unavailable until population reference data is reattached to the live source."
        })
      },
      ...(regionDrill
        ? {
            regions: {
              data: regionDrill.rows,
              provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY])
            }
          }
        : {})
    }
  });
}
