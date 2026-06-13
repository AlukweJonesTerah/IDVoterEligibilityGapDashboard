import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor, TARGET_TOTAL } from "@/lib/provenance";
import { readFilters, filterValues, filterSql } from "@/lib/filters-server";
import { fmt } from "@/lib/format";

export const dynamic = "force-dynamic";

const POOL_NOTE =
  "From the pool of records with demographic data in the live sources. Global filters do not apply to this pool; it is not the full 101k learner base.";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const params = filterValues(readFilters(req));

  const [totals, categories, countyMap, pool, age, disability, completion] = await Promise.all([
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
    db.query(`
      SELECT count(*)::int AS persons,
             count(gender)::int AS gender_known,
             count(*) FILTER (WHERE gender = 'FEMALE')::int AS female,
             count(age_band)::int AS age_known,
             count(*) FILTER (WHERE age_band IN ('18-24','25-34'))::int AS youth,
             count(has_disability)::int AS disability_known,
             count(*) FILTER (WHERE has_disability)::int AS pwd,
             count(has_device)::int AS device_known,
             count(*) FILTER (WHERE has_device)::int AS with_device
      FROM staging.demographic_persons`),
    db.query(`
      SELECT age_band AS label, count(*)::int AS learners
      FROM staging.demographic_persons WHERE age_band IS NOT NULL
      GROUP BY 1 ORDER BY 1`),
    db.query(`
      SELECT CASE WHEN has_disability THEN 'REPORTED DISABILITY' ELSE 'NO DISABILITY' END AS label,
             count(*)::int AS learners
      FROM staging.demographic_persons WHERE has_disability IS NOT NULL
      GROUP BY 1 ORDER BY 2 DESC`),
    db.query(`
      SELECT count(*)::int AS records,
             round(avg(quiz_average), 1)::float AS avg_quiz,
             count(*) FILTER (WHERE percent_complete >= 100)::int AS completed
      FROM staging.completion_records`)
  ]);

  const t = totals.rows[0];
  const p = pool.rows[0];
  const pct = (a: number, b: number) => (b > 0 ? Number(((100 * a) / b).toFixed(1)) : null);

  const partialPool = (coverage: string) =>
    provenanceFor(registry, ["county_cohort", "disability_supplement", "contacts", "busia_cohort"], {
      status: "partial",
      coverage,
      note: POOL_NOTE
    });

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
      inclusion: {
        data: {
          female_rate: pct(p.female, p.gender_known),
          youth_rate: pct(p.youth, p.age_known),
          pwd_learners: p.pwd,
          pwd_rate: pct(p.pwd, p.disability_known),
          device_rate: pct(p.with_device, p.device_known),
          gender_known: p.gender_known,
          age_known: p.age_known,
          disability_known: p.disability_known,
          device_known: p.device_known,
          persons: p.persons
        },
        provenance: partialPool(
          `Gender known for ${fmt(p.gender_known)} of ${fmt(p.persons)} pooled records; age for ${fmt(p.age_known)}; disability response for ${fmt(p.disability_known)}; device data for ${fmt(p.device_known)} (Busia pilot).`
        )
      },
      genderSplit: {
        data: [
          { gender: "FEMALE", learners: p.female },
          { gender: "MALE", learners: p.gender_known - p.female }
        ],
        provenance: partialPool(`Gender known for ${fmt(p.gender_known)} of ${fmt(p.persons)} pooled records.`)
      },
      age: {
        data: age.rows,
        provenance: provenanceFor(registry, ["county_cohort", "disability_supplement", "contacts", "busia_cohort"], {
          status: "partial",
          coverage: `Age group known for ${fmt(p.age_known)} of ${fmt(p.persons)} pooled records.`,
          note: "Source tables use inconsistent age buckets; bands harmonized into standard ranges (18-24, 25-34, 35-44, 45-54, 55+) by lower bound."
        })
      },
      disability: {
        data: disability.rows,
        provenance: partialPool(
          `Disability response recorded for ${fmt(p.disability_known)} of ${fmt(p.persons)} pooled records.`
        )
      },
      completion: {
        data: {
          measured: false,
          records: completion.rows[0].records,
          avg_quiz: completion.rows[0].avg_quiz,
          completed: completion.rows[0].completed
        },
        provenance: provenanceFor(registry, ["completion"], {
          status: "unavailable",
          note: `Only ${completion.rows[0].records} actual completion records are loaded; not representative of national completion. No modeled estimate is shown for this audience.`
        })
      }
    }
  });
}
