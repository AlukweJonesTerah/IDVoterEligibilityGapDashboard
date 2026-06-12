import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor, TARGET_TOTAL } from "@/lib/provenance";
import { readFilters, filterValues, filterSql, learnerScopeSql } from "@/lib/filters-server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const params = filterValues(readFilters(req));

  const [totals, categories, countyMap, genderSplit, age, disability, completion, inclusion] =
    await Promise.all([
      db.query(
        `SELECT count(*)::int AS enrolments,
                count(DISTINCT t.unique_id)::int AS unique_learners,
                count(DISTINCT t.county)::int AS counties,
                count(DISTINCT t.course_taken)::int AS courses,
                min(t.date_trained)::text AS first_date,
                max(t.date_trained)::text AS last_date
         FROM analytics.icta_training_data t WHERE ${filterSql("t")}`,
        params
      ),
      db.query(
        `SELECT t.course_category, count(*)::int AS enrolments
         FROM analytics.icta_training_data t WHERE ${filterSql("t")}
         GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
      db.query(
        `SELECT coalesce(c.county_name, initcap(t.county)) AS county_label,
                count(DISTINCT t.unique_id)::int AS learners
         FROM analytics.icta_training_data t
         LEFT JOIN ref.counties c ON ref.norm_county(c.county_name) = ref.norm_county(t.county)
         WHERE ${filterSql("t")}
         GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
      db.query(
        `SELECT a.gender, count(*)::int AS learners
         FROM sample.learner_attributes a WHERE ${learnerScopeSql("a")}
         GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
      db.query(
        `SELECT a.age_band AS label, count(*)::int AS learners
         FROM sample.learner_attributes a WHERE ${learnerScopeSql("a")}
         GROUP BY 1 ORDER BY 1`,
        params
      ),
      db.query(
        `SELECT a.disability_type AS label, count(*)::int AS learners
         FROM sample.learner_attributes a
         WHERE a.has_disability AND ${learnerScopeSql("a")}
         GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
      db.query(
        `SELECT round(100.0 * count(*) FILTER (WHERE e.status = 'COMPLETED') /
                 NULLIF(count(*) FILTER (WHERE e.status IN ('IN PROGRESS','COMPLETED')), 0), 1)::float AS completion_rate,
                round(avg(e.quiz_average), 1)::float AS avg_quiz
         FROM sample.enrolment_outcomes e WHERE ${filterSql("e")}`,
        params
      ),
      db.query(
        `SELECT round(100.0 * count(*) FILTER (WHERE a.gender = 'FEMALE') / NULLIF(count(*), 0), 1)::float AS female_rate,
                round(100.0 * count(*) FILTER (WHERE a.age_band IN ('18-24','25-34')) / NULLIF(count(*), 0), 1)::float AS youth_rate,
                count(*) FILTER (WHERE a.has_disability)::int AS pwd_learners,
                round(100.0 * count(*) FILTER (WHERE a.has_disability) / NULLIF(count(*), 0), 2)::float AS pwd_rate,
                round(100.0 * count(*) FILTER (WHERE a.has_device_access) / NULLIF(count(*), 0), 1)::float AS device_rate,
                round(100.0 * count(*) FILTER (WHERE a.has_regular_internet) / NULLIF(count(*), 0), 1)::float AS internet_rate
         FROM sample.learner_attributes a WHERE ${learnerScopeSql("a")}`,
        params
      )
    ]);

  const t = totals.rows[0];
  const blended = (note: string) =>
    provenanceFor(registry, ["training_records", "baseline"], { note });

  return NextResponse.json({
    widgets: {
      headline: {
        data: {
          uniqueLearners: t.unique_learners,
          enrolments: t.enrolments,
          counties: t.counties,
          courses: t.courses,
          firstDate: t.first_date,
          lastDate: t.last_date,
          target: TARGET_TOTAL,
          progressPct: Number((((t.unique_learners ?? 0) / TARGET_TOTAL) * 100).toFixed(2))
        },
        provenance: provenanceFor(registry, ["training_records"])
      },
      categories: {
        data: categories.rows,
        provenance: provenanceFor(registry, ["training_records"])
      },
      countyMap: {
        data: countyMap.rows,
        provenance: provenanceFor(registry, ["training_records"])
      },
      genderSplit: {
        data: genderSplit.rows,
        provenance: blended("Gender split is a modeled estimate pending the learner baseline dataset. Totals are actual.")
      },
      age: {
        data: age.rows,
        provenance: blended("Age bands are modeled estimates over real learner counts.")
      },
      disability: {
        data: disability.rows,
        provenance: blended("Disability profile is a modeled estimate over real learner counts.")
      },
      completion: {
        data: completion.rows[0],
        provenance: provenanceFor(registry, ["training_records", "completion"], {
          totalsReal: false,
          note: "Completion and quiz figures are modeled pending the course completion dataset."
        })
      },
      inclusion: {
        data: inclusion.rows[0],
        provenance: blended("Inclusion rates are modeled estimates over real learner counts.")
      }
    }
  });
}
