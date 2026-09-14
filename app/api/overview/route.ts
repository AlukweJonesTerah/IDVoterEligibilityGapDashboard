import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import {
  filterSql2009,
  filterSql2019,
  filterSqlIdHolders,
  filterValues2009,
  filterValues2019,
  filterValuesIgnoreAgeBand2009,
  filterValuesIgnoreAgeBand2019,
  filterValuesMapScope2019,
  idHoldersSexValue,
  readFilters
} from "@/lib/filters-server";

export const dynamic = "force-dynamic";

const DEFAULT_THRESHOLD: Record<"2019" | "2009", number> = { "2019": 11, "2009": 1 };

export async function GET(req: NextRequest) {
  return cachedJson(req, "overview", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";
    const filters = readFilters(req);

    if (year === "2019") {
      const p = filterValues2019(filters);
      const threshold = DEFAULT_THRESHOLD["2019"];
      const idHoldersParams = [idHoldersSexValue(filters), filters.county];

      const [total, adult, idHolders, voters, ageBand, gender, countyMap, topSubCounties, topSubCountiesTotal] = await Promise.all([
        db.query<{ v: string }>(
          `SELECT sum(population)::text AS v FROM analytics.census2019_pop WHERE ${filterSql2019("census2019_pop")}`,
          p
        ),
        db.query<{ v: string }>(
          `SELECT sum(population)::text AS v FROM analytics.census2019_pop
           WHERE age >= $6 AND ${filterSql2019("census2019_pop")}`,
          [...p, threshold]
        ),
        db.query<{ v: string }>(
          `SELECT sum(total)::text AS v FROM analytics.id_holders h
           WHERE ${filterSqlIdHolders("h")} AND ($2::text IS NULL OR ref.norm_county(h.county) = ref.norm_county($2::text))`,
          idHoldersParams
        ),
        db.query<{ v: string }>(
          `SELECT sum(registered_voters)::text AS v FROM analytics.registered_voters
           WHERE $1::text IS NULL OR ref.norm_county(county_name) = ref.norm_county($1::text)`,
          [filters.county]
        ),
        db.query<{ band: string; v: string }>(
          `SELECT custom_age_band AS band, sum(population)::text AS v
           FROM analytics.census2019_pop WHERE ${filterSql2019("census2019_pop")}
           GROUP BY 1 ORDER BY min(age)`,
          p
        ),
        db.query<{ gender: string; v: string }>(
          `SELECT gender, sum(population)::text AS v FROM analytics.census2019_pop
           WHERE ${filterSql2019("census2019_pop")} GROUP BY 1`,
          p
        ),
        db.query<{ name: string; v: string }>(
          `SELECT c.county_name AS name, sum(p.population)::text AS v
           FROM analytics.census2019_pop p JOIN ref.counties c ON c.county_code = p.county_code
           WHERE ${filterSql2019("p")} GROUP BY 1`,
          filterValuesMapScope2019(filters)
        ),
        // This widget hard-codes a single age (10, matching the source
        // report's own "Top Sub-Counties by Age 10 Population" table), so it
        // ignores the interactive age-band chip -- combining both would
        // otherwise AND two contradictory age conditions and silently
        // return zero rows.
        db.query<{ sub_county: string; county_name: string; v: string }>(
          `SELECT p.sub_county, c.county_name, sum(p.population)::text AS v
           FROM analytics.census2019_pop p JOIN ref.counties c ON c.county_code = p.county_code
           WHERE p.age = 10 AND ${filterSql2019("p")}
           GROUP BY 1, 2 ORDER BY sum(p.population) DESC LIMIT 350`,
          filterValuesIgnoreAgeBand2019(filters)
        ),
        // Grand total across every sub-county (not just the top 15 shown),
        // matching the source report's table footer.
        db.query<{ v: string }>(
          `SELECT sum(population)::text AS v FROM analytics.census2019_pop
           WHERE age = 10 AND ${filterSql2019("census2019_pop")}`,
          filterValuesIgnoreAgeBand2019(filters)
        )
      ]);

      const adultPop = Number(adult.rows[0]?.v ?? 0);
      const idHoldersTotal = Number(idHolders.rows[0]?.v ?? 0);
      const votersTotal = Number(voters.rows[0]?.v ?? 0);

      return {
        widgets: {
          headline: {
            data: {
              totalPopulation: Number(total.rows[0]?.v ?? 0),
              adultPopulation2026: adultPop,
              adultThreshold: threshold,
              idHolders: idHoldersTotal,
              idGap: Math.max(adultPop - idHoldersTotal, 0),
              registeredVoters: votersTotal,
              voterGap: Math.max(adultPop - votersTotal, 0)
            }
          },
          populationByAgeBand: { data: ageBand.rows.map((r) => ({ name: r.band, value: Number(r.v) })) },
          genderSplit: { data: gender.rows.map((r) => ({ name: r.gender, value: Number(r.v) })) },
          countyMap: { data: countyMap.rows.map((r) => ({ name: r.name, value: Number(r.v) })) },
          topAdminUnits: {
            data: topSubCounties.rows.map((r) => ({
              name: r.sub_county,
              county: r.county_name,
              value: Number(r.v)
            })),
            unitLabel: "Sub-county",
            ageLabel: "Age 10 population",
            total: Number(topSubCountiesTotal.rows[0]?.v ?? 0)
          }
        }
      };
    }

    // 2009 track (province/district geography, reconciled to county via
    // staging.district_to_county). id_holders/registered_voters are current,
    // county-keyed snapshots with no historical district breakdown, so those
    // two widgets ignore the province/district filter (gender/sex still
    // applies) -- flagged to the UI via `countyLevelOnly`.
    const p9 = filterValues2009(filters);
    const threshold9 = DEFAULT_THRESHOLD["2009"];
    const idHoldersParams9 = [idHoldersSexValue(filters)];

    const [total, adult, idHolders, voters, ageBand, gender, countyMap, topDistricts, topDistrictsTotal] = await Promise.all([
      db.query<{ v: string }>(
        `SELECT sum(population)::text AS v FROM analytics.census2009_pop WHERE ${filterSql2009("census2009_pop")}`,
        p9
      ),
      db.query<{ v: string }>(
        `SELECT sum(population)::text AS v FROM analytics.census2009_pop
         WHERE age >= $5 AND ${filterSql2009("census2009_pop")}`,
        [...p9, threshold9]
      ),
      db.query<{ v: string }>(
        `SELECT sum(total)::text AS v FROM analytics.id_holders h WHERE ${filterSqlIdHolders("h")}`,
        idHoldersParams9
      ),
      db.query<{ v: string }>(`SELECT sum(registered_voters)::text AS v FROM analytics.registered_voters`, []),
      db.query<{ band: string; v: string }>(
        `SELECT custom_age_band AS band, sum(population)::text AS v
         FROM analytics.census2009_pop WHERE ${filterSql2009("census2009_pop")}
         GROUP BY 1 ORDER BY min(age)`,
        p9
      ),
      db.query<{ gender: string; v: string }>(
        `SELECT gender, sum(population)::text AS v FROM analytics.census2009_pop
         WHERE ${filterSql2009("census2009_pop")} GROUP BY 1`,
        p9
      ),
      db.query<{ name: string; v: string }>(
        `SELECT c.county_name AS name, sum(p.population)::text AS v
         FROM analytics.census2009_pop p JOIN ref.counties c ON c.county_code = p.county_code
         WHERE ${filterSql2009("p")} GROUP BY 1`,
        p9
      ),
      // This widget hard-codes a single age (0, matching the source
      // report's "Top Districts by Age 0 Population" table), so it ignores
      // the interactive age-band chip for the same reason as the 2019 branch.
      db.query<{ district: string; province: string; v: string }>(
        `SELECT district, province, sum(population)::text AS v
         FROM analytics.census2009_pop WHERE age = 0 AND ${filterSql2009("census2009_pop")}
         GROUP BY 1, 2 ORDER BY sum(population) DESC LIMIT 200`,
        filterValuesIgnoreAgeBand2009(filters)
      ),
      // Grand total across every district (not just the top 15 shown),
      // matching the source report's table footer.
      db.query<{ v: string }>(
        `SELECT sum(population)::text AS v FROM analytics.census2009_pop
         WHERE age = 0 AND ${filterSql2009("census2009_pop")}`,
        filterValuesIgnoreAgeBand2009(filters)
      )
    ]);

    const adultPop = Number(adult.rows[0]?.v ?? 0);
    const idHoldersTotal = Number(idHolders.rows[0]?.v ?? 0);
    const votersTotal = Number(voters.rows[0]?.v ?? 0);

    return {
      widgets: {
        headline: {
          data: {
            totalPopulation: Number(total.rows[0]?.v ?? 0),
            adultPopulation2026: adultPop,
            adultThreshold: threshold9,
            idHolders: idHoldersTotal,
            idGap: Math.max(adultPop - idHoldersTotal, 0),
            registeredVoters: votersTotal,
            voterGap: Math.max(adultPop - votersTotal, 0),
            countyLevelOnly: true
          }
        },
        populationByAgeBand: { data: ageBand.rows.map((r) => ({ name: r.band, value: Number(r.v) })) },
        genderSplit: { data: gender.rows.map((r) => ({ name: r.gender, value: Number(r.v) })) },
        countyMap: { data: countyMap.rows.map((r) => ({ name: r.name, value: Number(r.v) })) },
        topAdminUnits: {
          data: topDistricts.rows.map((r) => ({ name: r.district, county: r.province, value: Number(r.v) })),
          unitLabel: "District",
          ageLabel: "Age 0 population",
          total: Number(topDistrictsTotal.rows[0]?.v ?? 0)
        }
      }
    };
  });
}
