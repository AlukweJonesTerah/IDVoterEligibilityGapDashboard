import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";

export const dynamic = "force-dynamic";

const MODELED_NOTE =
  "Demographic splits are modeled estimates over real learner counts, pending Datasets 2 and 7.";

export async function GET() {
  const registry = await getRegistry();

  const [gender, age, disability, education, employment, kpis] = await Promise.all([
    db.query(`SELECT gender AS label, count(*)::int AS learners
              FROM sample.learner_attributes GROUP BY 1 ORDER BY 2 DESC`),
    db.query(`SELECT age_band AS label, count(*)::int AS learners
              FROM sample.learner_attributes GROUP BY 1 ORDER BY 1`),
    db.query(`SELECT coalesce(disability_type, 'NO DISABILITY') AS label, count(*)::int AS learners
              FROM sample.learner_attributes GROUP BY 1 ORDER BY 2 DESC`),
    db.query(`SELECT education_level AS label, count(*)::int AS learners
              FROM sample.learner_attributes GROUP BY 1 ORDER BY 2 DESC`),
    db.query(`SELECT employment_status AS label, count(*)::int AS learners
              FROM sample.learner_attributes GROUP BY 1 ORDER BY 2 DESC`),
    db.query(`
      SELECT round(100.0 * count(*) FILTER (WHERE gender = 'FEMALE') / count(*), 1)::float AS female_rate,
             round(100.0 * count(*) FILTER (WHERE age_band IN ('18-24','25-34')) / count(*), 1)::float AS youth_rate,
             round(100.0 * count(*) FILTER (WHERE has_disability) / count(*), 2)::float AS pwd_rate,
             count(*) FILTER (WHERE has_disability)::int AS pwd_learners,
             round(100.0 * count(*) FILTER (WHERE has_device_access) / count(*), 1)::float AS device_rate,
             round(100.0 * count(*) FILTER (WHERE has_regular_internet) / count(*), 1)::float AS internet_rate,
             round(100.0 * count(*) FILTER (WHERE education_level IN ('NO FORMAL EDUCATION','PRIMARY')) / count(*), 1)::float AS low_education_rate
      FROM sample.learner_attributes`)
  ]);

  const blended = (note = MODELED_NOTE) =>
    provenanceFor(registry, ["training_records", "baseline"], { note });

  return NextResponse.json({
    widgets: {
      kpis: { data: kpis.rows[0], provenance: blended() },
      gender: { data: gender.rows, provenance: blended() },
      age: { data: age.rows, provenance: blended() },
      disability: { data: disability.rows, provenance: blended() },
      education: { data: education.rows, provenance: blended() },
      employment: { data: employment.rows, provenance: blended() }
    }
  });
}
