import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Filter dropdown options: counties, course categories, and the data window.
export async function GET() {
  const [counties, categories, dates] = await Promise.all([
    db.query(`
      SELECT DISTINCT coalesce(c.county_name, initcap(t.county)) AS county
      FROM analytics.icta_training_data t
      LEFT JOIN ref.counties c ON ref.norm_county(c.county_name) = ref.norm_county(t.county)
      ORDER BY 1`),
    db.query(`SELECT DISTINCT course_category FROM analytics.icta_training_data ORDER BY 1`),
    db.query(`SELECT min(date_trained)::text AS min_date, max(date_trained)::text AS max_date
              FROM analytics.icta_training_data`)
  ]);
  return NextResponse.json({
    counties: counties.rows.map((r) => r.county),
    categories: categories.rows.map((r) => r.course_category),
    ...dates.rows[0]
  });
}
