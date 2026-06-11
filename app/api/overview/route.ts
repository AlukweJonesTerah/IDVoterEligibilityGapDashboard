import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor, TARGET_TOTAL } from "@/lib/provenance";

export const dynamic = "force-dynamic";

export async function GET() {
  const registry = await getRegistry();

  const [totals, trend, categories, topCounties, genderSplit, completion, inclusion, quality] =
    await Promise.all([
      db.query(`
        SELECT count(*)::int AS enrolments,
               count(DISTINCT unique_id)::int AS unique_learners,
               count(DISTINCT county)::int AS counties,
               count(DISTINCT course_taken)::int AS courses,
               min(date_trained)::text AS first_date,
               max(date_trained)::text AS last_date
        FROM analytics.icta_training_data`),
      db.query(`
        SELECT date_trained::text AS day, count(*)::int AS enrolments,
               count(DISTINCT unique_id)::int AS learners
        FROM analytics.icta_training_data GROUP BY 1 ORDER BY 1`),
      db.query(`
        SELECT course_category, count(*)::int AS enrolments
        FROM analytics.icta_training_data GROUP BY 1 ORDER BY 2 DESC`),
      db.query(`
        SELECT t.county, coalesce(c.county_name, initcap(t.county)) AS county_label,
               count(DISTINCT t.unique_id)::int AS learners
        FROM analytics.icta_training_data t
        LEFT JOIN ref.counties c ON ref.norm_county(c.county_name) = ref.norm_county(t.county)
        GROUP BY 1, 2 ORDER BY 3 DESC`),
      db.query(`
        SELECT gender, count(*)::int AS learners
        FROM sample.learner_attributes GROUP BY 1 ORDER BY 2 DESC`),
      db.query(`
        SELECT round(100.0 * count(*) FILTER (WHERE status = 'COMPLETED') / count(*), 1)::float AS completion_rate,
               round(100.0 * count(*) FILTER (WHERE certification_ready) /
                     NULLIF(count(*) FILTER (WHERE status = 'COMPLETED'), 0), 1)::float AS certification_rate,
               round(avg(quiz_average), 1)::float AS avg_quiz
        FROM sample.enrolment_outcomes`),
      db.query(`
        SELECT round(100.0 * count(*) FILTER (WHERE gender = 'FEMALE') / count(*), 1)::float AS female_rate,
               round(100.0 * count(*) FILTER (WHERE age_band IN ('18-24','25-34')) / count(*), 1)::float AS youth_rate,
               count(*) FILTER (WHERE has_disability)::int AS pwd_learners,
               round(100.0 * count(*) FILTER (WHERE has_device_access) / count(*), 1)::float AS device_access_rate
        FROM sample.learner_attributes`),
      db.query(`
        SELECT (count(*) - count(DISTINCT unique_id))::int AS duplicate_rows,
               count(DISTINCT unique_id) FILTER (
                 WHERE unique_id IN (
                   SELECT unique_id FROM analytics.icta_training_data
                   GROUP BY unique_id, participant_name HAVING count(*) > 1))::int AS duplicate_ids
        FROM analytics.icta_training_data`)
    ]);

  const t = totals.rows[0];
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
          progressPct: Number(((t.unique_learners / TARGET_TOTAL) * 100).toFixed(2))
        },
        provenance: provenanceFor(registry, ["training_records"])
      },
      trend: {
        data: trend.rows,
        provenance: provenanceFor(registry, ["training_records"])
      },
      categories: {
        data: categories.rows,
        provenance: provenanceFor(registry, ["training_records"])
      },
      countyMap: {
        data: topCounties.rows,
        provenance: provenanceFor(registry, ["training_records"])
      },
      topCounties: {
        data: topCounties.rows.slice(0, 10),
        provenance: provenanceFor(registry, ["training_records"])
      },
      genderSplit: {
        data: genderSplit.rows,
        provenance: provenanceFor(registry, ["training_records", "baseline"], {
          note: "Gender split is a modeled estimate pending the learner baseline dataset. Totals are actual."
        })
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
        provenance: provenanceFor(registry, ["training_records", "baseline"], {
          note: "Inclusion splits are modeled estimates over real learner counts."
        })
      },
      quality: {
        data: quality.rows[0],
        provenance: provenanceFor(registry, ["training_records"])
      }
    }
  });
}
