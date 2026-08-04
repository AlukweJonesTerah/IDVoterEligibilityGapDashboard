import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, filterSql, isUnfiltered } from "@/lib/filters-server";
import { fmt } from "@/lib/format";
import { nonBlankSql, personKeySql, PROGRAMME_DATASET_KEY, PROGRAMME_TABLE, trainingRecordSql } from "@/lib/source-sql";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  return cachedJson(req, "courses", async () => {
  const registry = await getRegistry();
  const filters = readFilters(req);
  const params = filterValues(filters);
  const useSummary = isUnfiltered(filters);

  const [courses, categories, sourceRecords] = await Promise.all([
    useSummary
      ? db.query(`SELECT course, category, enrolments, learners FROM analytics.dashboard_course_summary_mv ORDER BY enrolments DESC`)
      : db.query(
        `SELECT t.course_taken AS course, t.course_category AS category,
              count(*)::int AS enrolments,
              count(DISTINCT ${personKeySql("t")})::int AS learners
       FROM ${PROGRAMME_TABLE} t
       WHERE ${trainingRecordSql("t")} AND ${nonBlankSql("t.course_taken")} AND ${filterSql("t")}
       GROUP BY t.course_taken, t.course_category
       ORDER BY enrolments DESC`,
        params
      ),
    useSummary
      ? db.query(`SELECT category, enrolments, learners FROM analytics.dashboard_course_category_summary_mv ORDER BY enrolments DESC`)
      : db.query(
        `SELECT t.course_category AS category, count(*)::int AS enrolments,
              count(DISTINCT ${personKeySql("t")})::int AS learners
       FROM ${PROGRAMME_TABLE} t
       WHERE ${trainingRecordSql("t")} AND ${nonBlankSql("t.course_category")} AND ${filterSql("t")}
       GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
    useSummary
      ? db.query(`
        SELECT enrolments AS total, source_gender_known AS gender_known,
               sources, courses
        FROM analytics.dashboard_overview_summary_mv`)
      : db.query(
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
          note: "Course enrolments and learners use training partner records with a populated course name."
        })
      },
      categories: {
        data: categories.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Course categories come from training partner records where the source supplied a category."
        })
      },
      registrations: {
        data: source,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          coverage: `${fmt(source.total)} combined source records across ${source.sources} partner or programme streams; gender present on ${fmt(source.gender_known)} records.`,
          note: "This is the combined live source table, not a separate registration feed."
        })
      }
    }
  };
  });
}
