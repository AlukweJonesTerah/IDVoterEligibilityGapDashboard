import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";
import { fmt } from "@/lib/format";
import { nonBlankSql, personKeySql, PROGRAMME_DATASET_KEY, PROGRAMME_TABLE } from "@/lib/source-sql";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return cachedJson(req, "courses", async () => {
  const registry = await getRegistry();
  const filters = readFilters(req);
  const params = filterValues(filters);

  const [courses, categories, sourceRecords] = await Promise.all([
    db.query(
      `SELECT t.course_taken AS course, t.course_category AS category,
              count(*)::int AS enrolments,
              count(DISTINCT ${personKeySql("t")})::int AS learners
       FROM ${PROGRAMME_TABLE} t
       WHERE t.source = 'Training' AND ${filterSql("t")}
       GROUP BY t.course_taken, t.course_category
       ORDER BY enrolments DESC`,
      params
    ),
    db.query(
      `SELECT t.course_category AS category, count(*)::int AS enrolments,
              count(DISTINCT ${personKeySql("t")})::int AS learners
       FROM ${PROGRAMME_TABLE} t
       WHERE t.source = 'Training' AND ${filterSql("t")}
       GROUP BY 1 ORDER BY 2 DESC`,
      params
    ),
    db.query(
      `SELECT count(*)::int AS total,
              count(*) FILTER (WHERE ${nonBlankSql("t.gender")})::int AS gender_known,
              count(DISTINCT t.source)::int AS sources,
              count(DISTINCT t.course_taken) FILTER (WHERE ${nonBlankSql("t.course_taken")})::int AS courses
       FROM ${PROGRAMME_TABLE} t
       WHERE ${filterSql("t")}`,
      params
    )
  ]);

  const source = sourceRecords.rows[0];

  return {
    widgets: {
      courses: {
        data: courses.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Course enrolments and learners are scoped to source = Training within analytics.20_million_by_2032."
        })
      },
      categories: {
        data: categories.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Course categories are populated on the Training stream only."
        })
      },
      registrations: {
        data: source,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          coverage: `${fmt(source.total)} combined source records across ${source.sources} source streams; gender present on ${fmt(source.gender_known)} records.`,
          note: "This is the combined live source table, not a separate registration feed."
        })
      }
    }
  };
  });
}
