import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { nonBlankSql, PROGRAMME_TABLE } from "@/lib/source-sql";

export const dynamic = "force-dynamic";

// Filter dropdown options: counties, partners, course categories, and the data window.
export async function GET(req: NextRequest) {
  return cachedJson(req, "meta", async () => {
  const [counties, partners, categories, dates] = await Promise.all([
    db.query(`SELECT county FROM analytics.dashboard_county_summary_mv ORDER BY 1`),
    db.query(`SELECT DISTINCT trim(source) AS partner FROM ${PROGRAMME_TABLE} WHERE ${nonBlankSql("source")} ORDER BY 1`),
    db.query(`SELECT DISTINCT trim(course_category) AS course_category FROM ${PROGRAMME_TABLE} WHERE ${nonBlankSql("course_category")} ORDER BY 1`),
    db.query(`SELECT first_date AS min_date, last_date AS max_date FROM analytics.dashboard_overview_summary_mv`)
  ]);
  return {
    counties: counties.rows.map((r) => r.county),
    partners: partners.rows.map((r) => r.partner),
    categories: categories.rows.map((r) => r.course_category),
    ...dates.rows[0]
  };
  });
}
