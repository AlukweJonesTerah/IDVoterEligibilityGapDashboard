import { db } from "@/lib/db";
import {
  filterSql2009,
  filterSql2019,
  filterSqlIdHolders,
  filterValues2009,
  filterValues2019,
  filterValuesMapScope2019,
  idHoldersSexValue,
  type Filters
} from "@/lib/filters-server";

export interface CountyGapRow {
  name: string;
  adults: number;
  idHolders: number;
  registeredVoters: number;
  gap: number;
  voterGap: number;
}

/**
 * County-level "projected adults (this threshold) vs current ID holders /
 * registered voters" gap, matching the report's Population_Without_IDs and
 * Reg_Diff DAX measures: both compare a census-projected adult population
 * against the SAME current, county-keyed ID/voter snapshots regardless of
 * which census year/threshold is selected.
 */
export async function countyIdGap(
  year: "2019" | "2009",
  threshold: number,
  filters: Filters,
  // Map widgets need the full county distribution regardless of the
  // county/sub-county filter (see filterValuesMapScope2019) -- otherwise
  // selecting a county collapses the map to just that one county, a dead
  // end since nothing else is left to click. Table/pivot callers leave this
  // false so they keep narrowing to the selected county as expected.
  ignoreCountyScope = false
): Promise<CountyGapRow[]> {
  const idHoldersSex = idHoldersSexValue(filters);

  const [idHoldersByCounty, votersByCounty, adultByCounty] = await Promise.all([
    db.query<{ county_code: number; v: string }>(
      `SELECT county_code, sum(total)::text AS v FROM analytics.id_holders h
       WHERE ${filterSqlIdHolders("h")} GROUP BY 1`,
      [idHoldersSex]
    ),
    db.query<{ county_code: number; v: string }>(
      `SELECT county_code, sum(registered_voters)::text AS v FROM analytics.registered_voters GROUP BY 1`
    ),
    year === "2019"
      ? db.query<{ county_code: number; county_name: string; v: string }>(
          `SELECT p.county_code, c.county_name, sum(p.population)::text AS v
           FROM analytics.census2019_pop p JOIN ref.counties c ON c.county_code = p.county_code
           WHERE p.age >= $6 AND ${filterSql2019("p")} GROUP BY 1, 2`,
          [...(ignoreCountyScope ? filterValuesMapScope2019(filters) : filterValues2019(filters)), threshold]
        )
      : db.query<{ county_code: number; county_name: string; v: string }>(
          `SELECT p.county_code, c.county_name, sum(p.population)::text AS v
           FROM analytics.census2009_pop p JOIN ref.counties c ON c.county_code = p.county_code
           WHERE p.age >= $5 AND ${filterSql2009("p")} GROUP BY 1, 2`,
          [...filterValues2009(filters), threshold]
        )
  ]);

  const idByCode = new Map(idHoldersByCounty.rows.map((r) => [r.county_code, Number(r.v)]));
  const votersByCode = new Map(votersByCounty.rows.map((r) => [r.county_code, Number(r.v)]));

  const rows = adultByCounty.rows.map((r) => {
    const adults = Number(r.v);
    const idHolders = idByCode.get(r.county_code) ?? 0;
    const registeredVoters = votersByCode.get(r.county_code) ?? 0;
    return {
      name: r.county_name,
      adults,
      idHolders,
      registeredVoters,
      gap: Math.max(adults - idHolders, 0),
      voterGap: Math.max(adults - registeredVoters, 0)
    };
  });
  rows.sort((a, b) => b.gap - a.gap);
  return rows;
}
