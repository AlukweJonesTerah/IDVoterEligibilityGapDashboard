import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const params = filterValues(readFilters(req));

  const [courses, categories, registrations] = await Promise.all([
    db.query(
      `SELECT t.course_taken AS course, t.course_category AS category,
              count(*)::int AS enrolments,
              count(DISTINCT t.unique_id)::int AS learners
       FROM analytics.icta_training_data t
       WHERE ${filterSql("t")}
       GROUP BY t.course_taken, t.course_category
       ORDER BY enrolments DESC`,
      params
    ),
    db.query(
      `SELECT t.course_category AS category, count(*)::int AS enrolments,
              count(DISTINCT t.unique_id)::int AS learners
       FROM analytics.icta_training_data t WHERE ${filterSql("t")}
       GROUP BY 1 ORDER BY 2 DESC`,
      params
    ),
    db.query(`
      SELECT count(*)::int AS total,
             count(gender)::int AS gender_known,
             count(DISTINCT course)::int AS courses
      FROM staging.registrations`)
  ]);

  const reg = registrations.rows[0];

  return NextResponse.json({
    widgets: {
      courses: {
        data: courses.rows,
        provenance: provenanceFor(registry, ["training_records"], {
          note: "Enrolments and learners per course come from actual live training records. Per-course completion and quiz figures are not yet in the source data."
        })
      },
      categories: {
        data: categories.rows,
        provenance: provenanceFor(registry, ["training_records"])
      },
      registrations: {
        data: reg,
        provenance: provenanceFor(registry, ["registration"], {
          status: "partial",
          coverage: `${fmt(reg.total)} registration records across ${reg.courses} course labels; gender present on ${fmt(reg.gender_known)}.`,
          note: "Intake measure from the registration source. There is no shared learner key to the training table, so this is never added to trained-learner counts."
        })
      }
    }
  });
}
