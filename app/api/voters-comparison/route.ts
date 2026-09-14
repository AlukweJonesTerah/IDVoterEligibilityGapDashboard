import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { filterSql2009, filterSql2019, filterValues2009, filterValues2019, readFilters } from "@/lib/filters-server";
import { countyIdGap } from "@/lib/queries/id-gap";

export const dynamic = "force-dynamic";

// The source report's Registered Voters Comparison page mixes two
// thresholds in the same table, confirmed against the report itself: the
// secondary (one-year-earlier) threshold for Adult Population and the
// voter-registration gap (2019: Adult Population 35,366,509 matches the
// 10+ page, not 11+), but the *primary* threshold for the ID-gap columns
// ("Population Without IDs" reuses the report's un-suffixed default
// Population_Without_IDs measure rather than its "10+ projection" sibling --
// e.g. Nairobi's 3,142,750 matches the 11+ Eligibility page exactly, not
// the 10+ figure).
const VOTER_THRESHOLD: Record<"2019" | "2009", number> = { "2019": 10, "2009": 0 };
const ID_GAP_THRESHOLD: Record<"2019" | "2009", number> = { "2019": 11, "2009": 1 };

export async function GET(req: NextRequest) {
  return cachedJson(req, "voters-comparison", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";
    const threshold = VOTER_THRESHOLD[year];
    const filters = readFilters(req);

    const [byAge, eligibleByBand, voterGapRows, idGapRows, mapVoterGapRows] = await Promise.all([
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
      countyIdGap(year, ID_GAP_THRESHOLD[year], filters),
      countyIdGap(year, threshold, filters, true)
    ]);

    // Merge: Adult Population/registered-voters columns from the page's own
    // (secondary) threshold, ID-holder/gap columns from the primary
    // threshold -- matching the source report's own mixed-threshold table.
    const idGapByCounty = new Map(idGapRows.map((r) => [r.name, r]));
    const mergedRows = voterGapRows.map((r) => {
      const idRow = idGapByCounty.get(r.name);
      return { ...r, idHolders: idRow?.idHolders ?? 0, gap: idRow?.gap ?? 0 };
    });

    return {
      widgets: {
        threshold: { data: threshold },
        ageSpecificDistribution: { data: byAge.rows.map((r) => ({ age: r.age, value: Number(r.v) })) },
        eligibleAdultsByAgeGroup: { data: eligibleByBand.rows.map((r) => ({ name: r.band, value: Number(r.v) })) },
        nonRegisteredVotersMap: { data: mapVoterGapRows.map((r) => ({ name: r.name, value: r.voterGap })) },
        idGapPivot: { data: mergedRows }
      }
    };
  });
}
