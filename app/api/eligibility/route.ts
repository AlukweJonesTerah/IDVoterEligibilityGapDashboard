import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { filterSql2009, filterSql2019, filterValues2009, filterValues2019, readFilters } from "@/lib/filters-server";
import { countyIdGap } from "@/lib/queries/id-gap";

export const dynamic = "force-dynamic";

const VALID_THRESHOLDS: Record<"2019" | "2009", number[]> = { "2019": [11, 10], "2009": [1, 0] };

export async function GET(req: NextRequest) {
  return cachedJson(req, "eligibility", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";
    const rawThreshold = Number(req.nextUrl.searchParams.get("threshold"));
    const threshold = VALID_THRESHOLDS[year].includes(rawThreshold) ? rawThreshold : VALID_THRESHOLDS[year][0];
    const filters = readFilters(req);

    const [byAge, eligibleByBand, gapRows, mapGapRows] = await Promise.all([
      year === "2019"
        ? db.query<{ age: number; v: string }>(
            `SELECT age, sum(population)::text AS v FROM analytics.census2019_pop
             WHERE ${filterSql2019("census2019_pop")} GROUP BY age ORDER BY age`,
            filterValues2019(filters)
          )
        : db.query<{ age: number; v: string }>(
            `SELECT age, sum(population)::text AS v FROM analytics.census2009_pop
             WHERE ${filterSql2009("census2009_pop")} GROUP BY age ORDER BY age`,
            filterValues2009(filters)
          ),
      year === "2019"
        ? db.query<{ band: string; v: string }>(
            `SELECT custom_age_band AS band, sum(population)::text AS v
             FROM analytics.census2019_pop WHERE age >= $6 AND ${filterSql2019("census2019_pop")}
             GROUP BY 1 ORDER BY min(age)`,
            [...filterValues2019(filters), threshold]
          )
        : db.query<{ band: string; v: string }>(
            `SELECT custom_age_band AS band, sum(population)::text AS v
             FROM analytics.census2009_pop WHERE age >= $5 AND ${filterSql2009("census2009_pop")}
             GROUP BY 1 ORDER BY min(age)`,
            [...filterValues2009(filters), threshold]
          ),
      countyIdGap(year, threshold, filters),
      countyIdGap(year, threshold, filters, true)
    ]);

    return {
      widgets: {
        threshold: { data: threshold },
        ageSpecificDistribution: { data: byAge.rows.map((r) => ({ age: r.age, value: Number(r.v) })) },
        eligibleAdultsByAgeGroup: { data: eligibleByBand.rows.map((r) => ({ name: r.band, value: Number(r.v) })) },
        idGapMap: { data: mapGapRows.map((r) => ({ name: r.name, value: r.gap })) },
        idGapPivot: { data: gapRows }
      }
    };
  });
}
