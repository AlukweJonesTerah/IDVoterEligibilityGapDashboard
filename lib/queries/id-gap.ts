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

export interface LocationGapRow {
  name: string;
  county: string;
  subcounty: string;
  division: string;
  population: number;
  idHolders: number;
  estimatedAdults: number;
  estimatedGap: number;
  /** Which ratio fed the estimate: this location's own sub-county (2019
   * only, when its name text-matches the census sub-county), or its parent
   * county otherwise -- surfaced so the UI can label confidence. */
  ratioSource: "subcounty" | "county";
}

export interface LocationGapResult {
  rows: LocationGapRow[];
  totalPopulation: number;
  totalIdHolders: number;
  totalEstimatedAdults: number;
  totalEstimatedGap: number;
}

function toLocationGapResult(
  rows: {
    location_name: string;
    county_name: string;
    subcounty: string;
    division: string;
    population: string;
    id_holders: string;
    estimated_adults: string;
    ratio_source: string;
  }[],
  totalRow: { population: string; id_holders: string; estimated_adults: string } | undefined
): LocationGapResult {
  const gapRows = rows.map((r) => {
    const population = Number(r.population);
    const idHolders = Number(r.id_holders);
    const estimatedAdults = Number(r.estimated_adults);
    return {
      name: r.location_name,
      county: r.county_name,
      subcounty: r.subcounty,
      division: r.division,
      population,
      idHolders,
      estimatedAdults,
      estimatedGap: Math.max(estimatedAdults - idHolders, 0),
      ratioSource: r.ratio_source as "subcounty" | "county"
    };
  });
  const totalPopulation = totalRow ? Number(totalRow.population) : 0;
  const totalIdHolders = totalRow ? Number(totalRow.id_holders) : 0;
  const totalEstimatedAdults = totalRow ? Number(totalRow.estimated_adults) : 0;
  return {
    rows: gapRows,
    totalPopulation,
    totalIdHolders,
    totalEstimatedAdults,
    totalEstimatedGap: Math.max(totalEstimatedAdults - totalIdHolders, 0)
  };
}

const LOCATION_GAP_ROW_LIMIT = 2000;

/**
 * Estimated adult-ID gap down to LOCATION level -- deeper than the source
 * report goes (its own Administrative Details pages stop at exact
 * per-location ID-holder counts with no adult-population comparison,
 * because it has no age-cut population below sub-county). We don't have
 * exact age-cut population at location level either, so this apportions
 * each location's known TOTAL population (analytics.id_eligibility.population)
 * by the adult-population SHARE of its parent area: sub-county when its
 * name text-matches a census sub-county (analytics.id_eligibility's admin
 * unit names come from the current ID registry, not the census, so ~30% of
 * sub-county names don't line up), falling back to county otherwise. This
 * is an ESTIMATE, not a census figure -- callers must label it as such.
 */
export async function locationIdGapEstimate2019(
  threshold: number,
  hasScope: boolean,
  countyCodes: number[]
): Promise<LocationGapResult> {
  const params = [threshold, hasScope, countyCodes];
  const estimateCte = `
    WITH subcounty_rate AS (
      SELECT county_code, sub_county,
        sum(population) FILTER (WHERE age >= $1) AS adults,
        sum(population) AS total
      FROM analytics.census2019_pop
      GROUP BY county_code, sub_county
    ),
    county_rate AS (
      SELECT county_code,
        sum(population) FILTER (WHERE age >= $1) AS adults,
        sum(population) AS total
      FROM analytics.census2019_pop
      GROUP BY county_code
    ),
    est AS (
      SELECT
        e.location_name, e.county_name, e.subcounty, e.division,
        e.population, e.id_holders,
        round(e.population * COALESCE(
          NULLIF(sr.adults, 0)::numeric / NULLIF(sr.total, 0),
          NULLIF(cr.adults, 0)::numeric / NULLIF(cr.total, 0),
          0
        )) AS estimated_adults,
        CASE WHEN sr.total > 0 THEN 'subcounty' ELSE 'county' END AS ratio_source
      FROM analytics.id_eligibility e
      LEFT JOIN subcounty_rate sr
        ON sr.county_code = e.county_code AND upper(btrim(sr.sub_county)) = upper(btrim(e.subcounty))
      LEFT JOIN county_rate cr ON cr.county_code = e.county_code
      WHERE $2::boolean = false OR e.county_code = ANY($3::int[])
    )`;

  const [rowsResult, totalResult] = await Promise.all([
    db.query<{
      location_name: string;
      county_name: string;
      subcounty: string;
      division: string;
      population: string;
      id_holders: string;
      estimated_adults: string;
      ratio_source: string;
    }>(
      `${estimateCte}
       SELECT location_name, county_name, subcounty, division,
         population::text AS population, id_holders::text AS id_holders,
         estimated_adults::text AS estimated_adults, ratio_source
       FROM est
       ORDER BY population DESC
       LIMIT ${LOCATION_GAP_ROW_LIMIT}`,
      params
    ),
    db.query<{ population: string; id_holders: string; estimated_adults: string }>(
      `${estimateCte}
       SELECT sum(population)::text AS population, sum(id_holders)::text AS id_holders,
         sum(estimated_adults)::text AS estimated_adults
       FROM est`,
      params
    )
  ]);

  return toLocationGapResult(rowsResult.rows, totalResult.rows[0]);
}

/**
 * Same idea for the 2009 track, but the ratio is always county-level: there
 * is no exact 2009 age-cut population below county (see
 * analytics.census2009_pop_county), so every row falls back to its county's
 * adult share applied to the location's current-day total population.
 */
export async function locationIdGapEstimate2009(
  threshold: number,
  hasScope: boolean,
  countyCodes: number[]
): Promise<LocationGapResult> {
  const params = [threshold, hasScope, countyCodes];
  const estimateCte = `
    WITH county_rate AS (
      SELECT county_code,
        sum(population) FILTER (WHERE age >= $1) AS adults,
        sum(population) AS total
      FROM analytics.census2009_pop_county
      GROUP BY county_code
    ),
    est AS (
      SELECT
        e.location_name, e.county_name, e.subcounty, e.division,
        e.population, e.id_holders,
        round(e.population * COALESCE(NULLIF(cr.adults, 0)::numeric / NULLIF(cr.total, 0), 0)) AS estimated_adults,
        'county'::text AS ratio_source
      FROM analytics.id_eligibility e
      LEFT JOIN county_rate cr ON cr.county_code = e.county_code
      WHERE $2::boolean = false OR e.county_code = ANY($3::int[])
    )`;

  const [rowsResult, totalResult] = await Promise.all([
    db.query<{
      location_name: string;
      county_name: string;
      subcounty: string;
      division: string;
      population: string;
      id_holders: string;
      estimated_adults: string;
      ratio_source: string;
    }>(
      `${estimateCte}
       SELECT location_name, county_name, subcounty, division,
         population::text AS population, id_holders::text AS id_holders,
         estimated_adults::text AS estimated_adults, ratio_source
       FROM est
       ORDER BY population DESC
       LIMIT ${LOCATION_GAP_ROW_LIMIT}`,
      params
    ),
    db.query<{ population: string; id_holders: string; estimated_adults: string }>(
      `${estimateCte}
       SELECT sum(population)::text AS population, sum(id_holders)::text AS id_holders,
         sum(estimated_adults)::text AS estimated_adults
       FROM est`,
      params
    )
  ]);

  return toLocationGapResult(rowsResult.rows, totalResult.rows[0]);
}
