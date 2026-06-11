import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const registry = await getRegistry();

  const [courses, categories] = await Promise.all([
    db.query(`
      SELECT t.course_taken AS course, t.course_category AS category,
             count(*)::int AS enrolments,
             count(DISTINCT t.unique_id)::int AS learners,
             o.completion_rate, o.avg_quiz
      FROM analytics.icta_training_data t
      LEFT JOIN LATERAL (
        SELECT round(100.0 * count(*) FILTER (WHERE status = 'COMPLETED') / count(*), 1)::float AS completion_rate,
               round(avg(quiz_average), 1)::float AS avg_quiz
        FROM sample.enrolment_outcomes e WHERE e.course_taken = t.course_taken
      ) o ON true
      GROUP BY t.course_taken, t.course_category, o.completion_rate, o.avg_quiz
      ORDER BY enrolments DESC`),
    db.query(`
      SELECT course_category AS category, count(*)::int AS enrolments,
             count(DISTINCT unique_id)::int AS learners
      FROM analytics.icta_training_data GROUP BY 1 ORDER BY 2 DESC`)
  ]);

  return NextResponse.json({
    widgets: {
      courses: {
        data: courses.rows,
        provenance: provenanceFor(registry, ["training_records", "completion"], {
          note: "Enrolments and learners per course are actual; completion rate and quiz averages are modeled."
        })
      },
      categories: {
        data: categories.rows,
        provenance: provenanceFor(registry, ["training_records"])
      }
    }
  });
}
