import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { fmt } from "@/lib/format";
import { demographicPoolFilterSql, partialPoolFilterNote, readFilters } from "@/lib/filters-server";

export const dynamic = "force-dynamic";

const POOL_KEYS = ["county_cohort", "disability_supplement", "contacts", "busia_cohort"];
const POOL_NOTE =
  "From the pool of live records with demographic data. County filters apply where the source records carry county; this is not the full 101k learner base.";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const filters = readFilters(req);
  const demographicParams = [filters.county];
  const unsupportedPartialFilters = partialPoolFilterNote(filters);

  const [kpis, gender, age, disability, education, device] = await Promise.all([
    db.query(`
      SELECT count(*)::int AS persons,
             count(gender)::int AS gender_known,
             count(*) FILTER (WHERE gender = 'FEMALE')::int AS female,
             count(age_band)::int AS age_known,
             count(*) FILTER (WHERE age_band IN ('18-24','25-34'))::int AS youth,
             count(has_disability)::int AS disability_known,
             count(*) FILTER (WHERE has_disability)::int AS pwd,
             count(has_device)::int AS device_known,
             count(*) FILTER (WHERE has_device)::int AS with_device,
             count(education_level)::int AS education_known
      FROM staging.demographic_persons d
      WHERE ${demographicPoolFilterSql("d")}`,
      demographicParams
    ),
    db.query(`
      SELECT gender AS label, count(*)::int AS learners
      FROM staging.demographic_persons d
      WHERE d.gender IS NOT NULL AND ${demographicPoolFilterSql("d")}
      GROUP BY 1 ORDER BY 2 DESC`,
      demographicParams
    ),
    db.query(`
      SELECT age_band AS label, count(*)::int AS learners
      FROM staging.demographic_persons d
      WHERE d.age_band IS NOT NULL AND ${demographicPoolFilterSql("d")}
      GROUP BY 1 ORDER BY 1`,
      demographicParams
    ),
    db.query(`
      SELECT CASE WHEN has_disability THEN 'REPORTED DISABILITY' ELSE 'NO DISABILITY' END AS label,
             count(*)::int AS learners
      FROM staging.demographic_persons d
      WHERE d.has_disability IS NOT NULL AND ${demographicPoolFilterSql("d")}
      GROUP BY 1 ORDER BY 2 DESC`,
      demographicParams
    ),
    db.query(`
      SELECT education_level AS label, count(*)::int AS learners
      FROM staging.demographic_persons d
      WHERE d.education_level IS NOT NULL AND ${demographicPoolFilterSql("d")}
      GROUP BY 1 ORDER BY 2 DESC`,
      demographicParams
    ),
    db.query(`
      SELECT CASE WHEN has_device THEN 'HAS DEVICE' ELSE 'NO DEVICE' END AS label,
             count(*)::int AS learners
      FROM staging.demographic_persons d
      WHERE d.has_device IS NOT NULL AND ${demographicPoolFilterSql("d")}
      GROUP BY 1 ORDER BY 2 DESC`,
      demographicParams
    )
  ]);

  const k = kpis.rows[0];
  const pct = (a: number, b: number) => (b > 0 ? Number(((100 * a) / b).toFixed(1)) : null);
  const partial = (coverage: string) =>
    provenanceFor(registry, POOL_KEYS, {
      status: "partial",
      coverage,
      note: unsupportedPartialFilters ? `${POOL_NOTE} ${unsupportedPartialFilters}` : POOL_NOTE
    });

  return NextResponse.json({
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
        provenance: provenanceFor(registry, POOL_KEYS, {
          status: "partial",
          coverage: `Age group known for ${fmt(k.age_known)} of ${fmt(k.persons)} pooled records.`,
          note: "Source tables use inconsistent age buckets; bands harmonized into standard ranges (18-24, 25-34, 35-44, 45-54, 55+) by lower bound."
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
          `Education level known for ${fmt(k.education_known)} of ${fmt(k.persons)} pooled records (Busia and county cohort sources).`
        )
      },
      device: {
        data: device.rows,
        provenance: partial(
          `Device data exists for ${fmt(k.device_known)} records from the Busia pilot only; not a national measure.`
        )
      },
      employment: {
        data: [],
        provenance: provenanceFor(registry, ["baseline"], {
          status: "unavailable",
          note: "Employment status comes from the learner baseline dataset, which has no rows yet."
        })
      }
    }
  });
}
