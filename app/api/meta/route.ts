import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Filter dropdown options: counties, course categories, and the data window.
export async function GET(req: NextRequest) {
  return cachedJson(req, "meta", async () => {
  const [counties, categories, dates] = await Promise.all([
    db.query(`SELECT county FROM analytics.dashboard_county_summary_mv ORDER BY 1`),
    db.query(`SELECT category AS course_category FROM analytics.dashboard_course_category_summary_mv WHERE category IS NOT NULL AND trim(category) <> '' ORDER BY 1`),
    db.query(`SELECT first_date AS min_date, last_date AS max_date FROM analytics.dashboard_overview_summary_mv`)
  ]);
  return {
    counties: counties.rows.map((r) => r.county),
    categories: categories.rows.map((r) => r.course_category),
    ...dates.rows[0]
  };
  });
}
