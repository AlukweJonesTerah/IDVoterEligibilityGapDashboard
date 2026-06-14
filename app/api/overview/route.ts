import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor, TARGET_TOTAL } from "@/lib/provenance";
import { readFilters, filterValues, filterSql, isUnfiltered } from "@/lib/filters-server";
import { fmt } from "@/lib/format";
import {
  ageBandSql,
  hasDeviceSql,
  kenyaCountyValuesSql,
  nonBlankSql,
  personKeySql,
  PROGRAMME_DATASET_KEY,
  PROGRAMME_TABLE
} from "@/lib/source-sql";

export const dynamic = "force-dynamic";

const TABLE_NOTE =
  "From analytics.20_million_by_2032, the combined source covering Training, Citizens and KICTANET streams. Course and date filters only apply where those fields exist.";

export async function GET(req: NextRequest) {
  return cachedJson(req, "overview", async () => {
  const registry = await getRegistry();
  const filters = readFilters(req);
  const params = filterValues(filters);
  const useSummary = isUnfiltered(filters);

  const [totals, categories, courseLeaderboard, countyMap, pool, age, disability, education, completion] = await Promise.all([
    useSummary
      ? db.query(`SELECT enrolments, unique_learners, counties, courses, first_date, last_date FROM analytics.dashboard_overview_summary_mv`)
      : db.query(
        `SELECT count(*)::int AS enrolments,
              count(DISTINCT ${personKeySql("t")})::int AS unique_learners,
              count(DISTINCT kc.county_norm)::int AS counties,
              count(DISTINCT t.course_taken) FILTER (WHERE ${nonBlankSql("t.course_taken")})::int AS courses,
              min(t.date_trained)::text AS first_date,
              max(t.date_trained)::text AS last_date
       FROM ${PROGRAMME_TABLE} t
       LEFT JOIN ${kenyaCountyValuesSql("kc")} ON kc.county_norm = regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g')
       WHERE ${filterSql("t")}`,
        params
      ),
    useSummary
      ? db.query(`SELECT course_category, enrolments FROM analytics.dashboard_course_category_summary_mv ORDER BY enrolments DESC`)
      : db.query(
        `SELECT t.course_category, count(*)::int AS enrolments
       FROM ${PROGRAMME_TABLE} t
       WHERE t.source = 'Training' AND ${filterSql("t")}
       GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
    useSummary
      ? db.query(`SELECT course, category, enrolments, learners FROM analytics.dashboard_course_summary_mv ORDER BY enrolments DESC`)
      : db.query(
        `SELECT t.course_taken AS course, t.course_category AS category,
              count(*)::int AS enrolments,
              count(DISTINCT ${personKeySql("t")})::int AS learners
       FROM ${PROGRAMME_TABLE} t
       WHERE t.source = 'Training' AND ${filterSql("t")}
       GROUP BY t.course_taken, t.course_category
       ORDER BY enrolments DESC`,
        params
      ),
    useSummary
      ? db.query(`SELECT county_label, learners FROM analytics.dashboard_county_summary_mv ORDER BY learners DESC`)
      : db.query(
        `SELECT kc.county_name AS county_label,
              count(DISTINCT ${personKeySql("t")})::int AS learners
       FROM ${PROGRAMME_TABLE} t
       JOIN ${kenyaCountyValuesSql("kc")} ON kc.county_norm = regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g')
       WHERE ${filterSql("t")}
       GROUP BY kc.county_name ORDER BY 2 DESC`,
        params
      ),
    useSummary
      ? db.query(`
        SELECT unique_learners AS persons, gender_known, female, age_known, youth,
               disability_known, pwd, device_known, with_device, education_known
        FROM analytics.dashboard_overview_summary_mv`)
      : db.query(`
      SELECT count(*)::int AS persons,
             count(gender)::int AS gender_known,
             count(*) FILTER (WHERE lower(trim(gender)) = 'female')::int AS female,
             count(age_band)::int AS age_known,
             count(*) FILTER (WHERE age_band IN ('18-24','25-34'))::int AS youth,
             count(disability_status)::int AS disability_known,
             count(*) FILTER (WHERE lower(trim(disability_status)) = 'yes')::int AS pwd,
             count(*) FILTER (WHERE has_device_known)::int AS device_known,
             count(*) FILTER (WHERE has_device_known AND has_device)::int AS with_device,
             count(education_level)::int AS education_known
      FROM (
        SELECT DISTINCT ON (${personKeySql("t")})
               ${personKeySql("t")} AS person_key,
               nullif(trim(t.gender), '') AS gender,
               ${ageBandSql("t.age_group")} AS age_band,
               nullif(trim(t.disability_status), '') AS disability_status,
               (${hasDeviceSql("t")}) AS has_device,
               (${nonBlankSql("t.has_device")} OR ${nonBlankSql("t.device_used")} OR ${nonBlankSql("t.device_type")}) AS has_device_known,
               nullif(trim(t.education_level), '') AS education_level
        FROM ${PROGRAMME_TABLE} t
        WHERE ${filterSql("t")}
        ORDER BY ${personKeySql("t")},
          CASE WHEN ${nonBlankSql("t.gender")} THEN 0 ELSE 1 END,
          CASE WHEN ${nonBlankSql("t.age_group")} THEN 0 ELSE 1 END,
          CASE WHEN ${nonBlankSql("t.education_level")} THEN 0 ELSE 1 END
      ) d`,
        params
      ),
    useSummary
      ? db.query(`
        SELECT label, learners
        FROM analytics.dashboard_age_summary_mv
        ORDER BY CASE label WHEN '18-24' THEN 1 WHEN '25-34' THEN 2 WHEN '35+' THEN 3 WHEN '45-54' THEN 4 WHEN '55+' THEN 5 ELSE 99 END`)
      : db.query(`
      SELECT age_band AS label, count(*)::int AS learners
      FROM (
        SELECT ${personKeySql("t")} AS person_key, ${ageBandSql("t.age_group")} AS age_band
        FROM ${PROGRAMME_TABLE} t WHERE ${filterSql("t")}
        GROUP BY 1, 2
      ) d
      WHERE d.age_band IS NOT NULL
      GROUP BY 1
      ORDER BY CASE age_band WHEN '18-24' THEN 1 WHEN '25-34' THEN 2 WHEN '35+' THEN 3 WHEN '45-54' THEN 4 WHEN '55+' THEN 5 ELSE 99 END`,
        params
      ),
    useSummary
      ? db.query(`SELECT label, learners FROM analytics.dashboard_disability_summary_mv ORDER BY learners DESC`)
      : db.query(`
      SELECT CASE WHEN lower(trim(disability_status)) = 'yes' THEN 'REPORTED DISABILITY' ELSE 'NO DISABILITY' END AS label,
             count(*)::int AS learners
      FROM (
        SELECT ${personKeySql("t")} AS person_key, nullif(trim(t.disability_status), '') AS disability_status
        FROM ${PROGRAMME_TABLE} t WHERE ${filterSql("t")}
        GROUP BY 1, 2
      ) d
      WHERE d.disability_status IS NOT NULL
      GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
    useSummary
      ? db.query(`SELECT label, learners FROM analytics.dashboard_education_summary_mv ORDER BY learners DESC`)
      : db.query(`
      SELECT education_level AS label, count(*)::int AS learners
      FROM (
        SELECT ${personKeySql("t")} AS person_key, nullif(trim(t.education_level), '') AS education_level
        FROM ${PROGRAMME_TABLE} t WHERE ${filterSql("t")}
        GROUP BY 1, 2
      ) d
      WHERE d.education_level IS NOT NULL
      GROUP BY 1 ORDER BY 2 DESC`,
        params
      ),
    useSummary
      ? db.query(`SELECT completion_records AS records, avg_quiz, completed FROM analytics.dashboard_overview_summary_mv`)
      : db.query(`
      SELECT count(*)::int AS records,
             round(avg(quiz_average), 1)::float AS avg_quiz,
             count(*) FILTER (WHERE pct_complete >= 100 OR completion_date IS NOT NULL)::int AS completed
      FROM ${PROGRAMME_TABLE} t WHERE ${filterSql("t")} AND (t.pct_complete IS NOT NULL OR t.completion_date IS NOT NULL)`,
        params
      )
  ]);

  const t = totals.rows[0];
  const p = pool.rows[0];
  const pct = (a: number, b: number) => (b > 0 ? Number(((100 * a) / b).toFixed(1)) : null);

  const partialPool = (coverage: string) =>
    provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
      status: "partial",
      coverage,
      note: TABLE_NOTE
    });

  return {
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
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], { note: TABLE_NOTE })
      },
      categories: {
        data: categories.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Course categories come from the Training stream inside the combined source table."
        })
      },
      courseLeaderboard: {
        data: courseLeaderboard.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          note: "Course enrolments and learners are scoped to source = Training within analytics.20_million_by_2032."
        })
      },
      countyMap: {
        data: countyMap.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], { note: TABLE_NOTE })
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
          education_known: p.education_known,
          persons: p.persons
        },
        provenance: partialPool(
          `Gender known for ${fmt(p.gender_known)} of ${fmt(p.persons)} pooled records; age for ${fmt(p.age_known)}; disability response for ${fmt(p.disability_known)}; device data for ${fmt(p.device_known)} (Busia pilot).`
        )
      },
      genderSplit: {
        // Largest slice first, matching the Demographics page, so the same
        // category gets the same palette colour on both pages.
        data: [
          { gender: "MALE", learners: p.gender_known - p.female },
          { gender: "FEMALE", learners: p.female }
        ],
        provenance: partialPool(`Gender known for ${fmt(p.gender_known)} of ${fmt(p.persons)} pooled records.`)
      },
      age: {
        data: age.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "partial",
          coverage: `Age group known for ${fmt(p.age_known)} of ${fmt(p.persons)} pooled records.`,
          note: "Source age labels are harmonized into broad bands from analytics.20_million_by_2032."
        })
      },
      disability: {
        data: disability.rows,
        provenance: partialPool(
          `Disability response recorded for ${fmt(p.disability_known)} of ${fmt(p.persons)} pooled records.`
        )
      },
      education: {
        data: education.rows,
        provenance: partialPool(
          `Education level known for ${fmt(p.education_known)} of ${fmt(p.persons)} pooled records.`
        )
      },
      completion: {
        data: {
          measured: false,
          records: completion.rows[0].records,
          avg_quiz: completion.rows[0].avg_quiz,
          completed: completion.rows[0].completed
        },
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "unavailable",
          note: `Only ${completion.rows[0].records} records have completion fields in analytics.20_million_by_2032; not representative of the full programme. No modeled estimate is shown.`
        })
      }
    }
  };
  });
}
