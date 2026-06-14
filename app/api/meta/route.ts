import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { kenyaCountyValuesSql, PROGRAMME_TABLE } from "@/lib/source-sql";

export const dynamic = "force-dynamic";

// Filter dropdown options: counties, course categories, and the data window.
export async function GET(req: NextRequest) {
  return cachedJson(req, "meta", async () => {
  const [counties, categories, dates] = await Promise.all([
    db.query(`
      SELECT DISTINCT kc.county_name AS county
      FROM ${PROGRAMME_TABLE} t
      JOIN ${kenyaCountyValuesSql("kc")} ON kc.county_norm = regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g')
      ORDER BY 1`),
    db.query(`SELECT DISTINCT course_category FROM ${PROGRAMME_TABLE} WHERE course_category IS NOT NULL AND trim(course_category) <> '' ORDER BY 1`),
    db.query(`SELECT min(date_trained)::text AS min_date, max(date_trained)::text AS max_date
              FROM ${PROGRAMME_TABLE}`)
  ]);
  return {
    counties: counties.rows.map((r) => r.county),
    categories: categories.rows.map((r) => r.course_category),
    ...dates.rows[0]
  };
  });
}
