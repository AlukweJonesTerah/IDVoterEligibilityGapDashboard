import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const params = filterValues(readFilters(req));

  const [courses, categories] = await Promise.all([
    db.query(
      `SELECT t.course_taken AS course, t.course_category AS category,
              count(*)::int AS enrolments,
              count(DISTINCT t.unique_id)::int AS learners,
              o.completion_rate, o.avg_quiz
       FROM analytics.icta_training_data t
       LEFT JOIN LATERAL (
         SELECT round(100.0 * count(*) FILTER (WHERE e.status = 'COMPLETED') /
                NULLIF(count(*) FILTER (WHERE e.status IN ('IN PROGRESS','COMPLETED')), 0), 1)::float AS completion_rate,
                round(avg(e.quiz_average), 1)::float AS avg_quiz
         FROM sample.enrolment_outcomes e
         WHERE e.course_taken = t.course_taken
           AND ($1::text IS NULL OR ref.norm_county(e.county) = ref.norm_county($1::text))
           AND ($3::date IS NULL OR e.date_trained >= $3::date)
           AND ($4::date IS NULL OR e.date_trained <= $4::date)
       ) o ON true
       WHERE ${filterSql("t")}
       GROUP BY t.course_taken, t.course_category, o.completion_rate, o.avg_quiz
       ORDER BY enrolments DESC`,
      params
    ),
    db.query(
      `SELECT t.course_category AS category, count(*)::int AS enrolments,
              count(DISTINCT t.unique_id)::int AS learners
       FROM analytics.icta_training_data t WHERE ${filterSql("t")}
       GROUP BY 1 ORDER BY 2 DESC`,
      params
    )
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
