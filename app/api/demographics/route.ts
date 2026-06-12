import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRegistry, provenanceFor } from "@/lib/provenance";
import { readFilters, filterValues, learnerScopeSql } from "@/lib/filters-server";

export const dynamic = "force-dynamic";

const MODELED_NOTE =
  "Demographic splits are modeled estimates over real learner counts, pending Datasets 2 and 7.";

export async function GET(req: NextRequest) {
  const registry = await getRegistry();
  const params = filterValues(readFilters(req));
  const scoped = (select: string, extra = "") =>
    db.query(
      `SELECT ${select} FROM sample.learner_attributes a WHERE ${learnerScopeSql("a")} ${extra}`,
      params
    );

  const [gender, age, disability, education, employment, kpis] = await Promise.all([
    scoped("a.gender AS label, count(*)::int AS learners", "GROUP BY 1 ORDER BY 2 DESC"),
    scoped("a.age_band AS label, count(*)::int AS learners", "GROUP BY 1 ORDER BY 1"),
    scoped(
      "coalesce(a.disability_type, 'NO DISABILITY') AS label, count(*)::int AS learners",
      "GROUP BY 1 ORDER BY 2 DESC"
    ),
    scoped("a.education_level AS label, count(*)::int AS learners", "GROUP BY 1 ORDER BY 2 DESC"),
    scoped("a.employment_status AS label, count(*)::int AS learners", "GROUP BY 1 ORDER BY 2 DESC"),
    scoped(`
      round(100.0 * count(*) FILTER (WHERE a.gender = 'FEMALE') / NULLIF(count(*), 0), 1)::float AS female_rate,
      round(100.0 * count(*) FILTER (WHERE a.age_band IN ('18-24','25-34')) / NULLIF(count(*), 0), 1)::float AS youth_rate,
      round(100.0 * count(*) FILTER (WHERE a.has_disability) / NULLIF(count(*), 0), 2)::float AS pwd_rate,
      count(*) FILTER (WHERE a.has_disability)::int AS pwd_learners,
      round(100.0 * count(*) FILTER (WHERE a.has_device_access) / NULLIF(count(*), 0), 1)::float AS device_rate,
      round(100.0 * count(*) FILTER (WHERE a.has_regular_internet) / NULLIF(count(*), 0), 1)::float AS internet_rate,
      round(100.0 * count(*) FILTER (WHERE a.education_level IN ('NO FORMAL EDUCATION','PRIMARY')) / NULLIF(count(*), 0), 1)::float AS low_education_rate`)
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
