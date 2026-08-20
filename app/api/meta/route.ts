import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { kenyaCountyValuesSql, nonBlankSql, PROGRAMME_TABLE } from "@/lib/source-sql";

export const dynamic = "force-dynamic";

// Filter dropdown options: counties, sources, partners, course categories, and the data window.
export async function GET(req: NextRequest) {
  return cachedJson(req, "meta", async () => {
  const [counties, sources, partners, categories, dates] = await Promise.all([
    db.query(`
      SELECT kc.county_name AS county
      FROM ${kenyaCountyValuesSql("kc")}
      WHERE EXISTS (
        SELECT 1 FROM ${PROGRAMME_TABLE} t
        WHERE kc.county_norm = regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g')
      )
      ORDER BY 1`),
    db.query(`SELECT DISTINCT trim(source) AS source FROM ${PROGRAMME_TABLE} WHERE ${nonBlankSql("source")} ORDER BY 1`),
    db.query(`SELECT DISTINCT trim(partner) AS partner FROM ${PROGRAMME_TABLE} WHERE ${nonBlankSql("partner")} ORDER BY 1`),
    db.query(`SELECT DISTINCT trim(course_category) AS course_category FROM ${PROGRAMME_TABLE} WHERE ${nonBlankSql("course_category")} ORDER BY 1`),
    db.query(`SELECT min(date_trained)::text AS min_date, max(date_trained)::text AS max_date FROM ${PROGRAMME_TABLE}`)
  ]);
  return {
    counties: counties.rows.map((r) => r.county),
    sources: sources.rows.map((r) => r.source),
    partners: partners.rows.map((r) => r.partner),
    categories: categories.rows.map((r) => r.course_category),
    ...dates.rows[0]
  };
  });
}
