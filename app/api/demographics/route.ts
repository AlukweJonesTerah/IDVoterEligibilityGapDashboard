import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { fmt } from "@/lib/format";
import { filterSql, filterValues, isUnfiltered, readFilters } from "@/lib/filters-server";
import {
  ageBandSql,
  hasDeviceSql,
  nonBlankSql,
  personKeySql,
  PROGRAMME_DATASET_KEY,
  PROGRAMME_TABLE
} from "@/lib/source-sql";

export const dynamic = "force-dynamic";

const POOL_NOTE =
  "From analytics.20_million_by_2032. Coverage varies by field because not every source stream carries every demographic value.";

export async function GET(req: NextRequest) {
  return cachedJson(req, "demographics", async () => {
  const registry = await getRegistry();
  const filters = readFilters(req);
  const params = filterValues(filters);
  const useSummary = isUnfiltered(filters);

  const [kpis, gender, age, disability, education, device] = await Promise.all([
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
      ? db.query(`SELECT label, learners FROM analytics.dashboard_gender_summary_mv ORDER BY learners DESC`)
      : db.query(`
      SELECT gender AS label, count(*)::int AS learners
      FROM (
        SELECT ${personKeySql("t")} AS person_key, nullif(trim(t.gender), '') AS gender
        FROM ${PROGRAMME_TABLE} t WHERE ${filterSql("t")}
        GROUP BY 1, 2
      ) d
      WHERE d.gender IS NOT NULL
      GROUP BY 1 ORDER BY 2 DESC`,
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
      ? db.query(`SELECT label, learners FROM analytics.dashboard_device_summary_mv ORDER BY learners DESC`)
      : db.query(`
      SELECT CASE WHEN has_device THEN 'HAS DEVICE' ELSE 'NO DEVICE' END AS label,
             count(*)::int AS learners
      FROM (
        SELECT ${personKeySql("t")} AS person_key,
               (${hasDeviceSql("t")}) AS has_device,
               (${nonBlankSql("t.has_device")} OR ${nonBlankSql("t.device_used")} OR ${nonBlankSql("t.device_type")}) AS has_device_known
        FROM ${PROGRAMME_TABLE} t WHERE ${filterSql("t")}
        GROUP BY 1, 2, 3
      ) d
      WHERE d.has_device_known
      GROUP BY 1 ORDER BY 2 DESC`,
        params
      )
  ]);

  const k = kpis.rows[0];
  const pct = (a: number, b: number) => (b > 0 ? Number(((100 * a) / b).toFixed(1)) : null);
  const partial = (coverage: string) =>
    provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
      status: "partial",
      coverage,
      note: POOL_NOTE
    });

  return {
    widgets: {
      kpis: {
        data: {
          female_rate: pct(k.female, k.gender_known),
          youth_rate: pct(k.youth, k.age_known),
          pwd_learners: k.pwd,
          pwd_rate: pct(k.pwd, k.disability_known),
          device_rate: pct(k.with_device, k.device_known),
          persons: k.persons,
          gender_known: k.gender_known,
          age_known: k.age_known,
          disability_known: k.disability_known,
          device_known: k.device_known,
          education_known: k.education_known
        },
        provenance: partial(
          `Pool of ${fmt(k.persons)} deduplicated records: gender ${fmt(k.gender_known)}, age ${fmt(k.age_known)}, disability response ${fmt(k.disability_known)}, education ${fmt(k.education_known)}, device ${fmt(k.device_known)} (Busia pilot).`
        )
      },
      gender: {
        data: gender.rows,
        provenance: partial(`Gender known for ${fmt(k.gender_known)} of ${fmt(k.persons)} pooled records.`)
      },
      age: {
        data: age.rows,
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "partial",
          coverage: `Age group known for ${fmt(k.age_known)} of ${fmt(k.persons)} pooled records.`,
          note: "Source age labels are harmonized into broad bands from analytics.20_million_by_2032."
        })
      },
      disability: {
        data: disability.rows,
        provenance: partial(
          `Disability response recorded for ${fmt(k.disability_known)} of ${fmt(k.persons)} pooled records.`
        )
      },
      education: {
        data: education.rows,
        provenance: partial(
          `Education level known for ${fmt(k.education_known)} of ${fmt(k.persons)} pooled records.`
        )
      },
      device: {
        data: device.rows,
        provenance: partial(
          `Device data exists for ${fmt(k.device_known)} of ${fmt(k.persons)} pooled records.`
        )
      },
      employment: {
        data: [],
        provenance: provenanceFor(registry, [PROGRAMME_DATASET_KEY], {
          status: "partial",
          note: "Employment status exists in the combined table but is not yet visualized on this page."
        })
      }
    }
  };
  });
}
