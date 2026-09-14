import type { NextRequest } from "next/server";

// Global dashboard filters. year/threshold are route segments (they change
// which tables get queried), not filters -- everything here is a plain
// WHERE-clause scope on top of that.
export interface Filters {
  gender: "both" | "male" | "female";
  county: string | null;
  subCounty: string | null;
  division: string | null;
  location: string | null;
  province: string | null;
  district: string | null;
  ageBand: string | null;
}

export function readFilters(req: NextRequest): Filters {
  const p = req.nextUrl.searchParams;
  const gender = p.get("fgender");
  return {
    gender: gender === "male" || gender === "female" ? gender : "both",
    county: p.get("fcounty") || null,
    subCounty: p.get("fsubcounty") || null,
    division: p.get("fdivision") || null,
    location: p.get("flocation") || null,
    province: p.get("fprovince") || null,
    district: p.get("fdistrict") || null,
    ageBand: p.get("fageband") || null
  };
}

/**
 * Positional params for the 2019 track (county/sub-county/age-band
 * geography): $1 gender-as-"Male"/"Female"/null, $2 county, $3 sub-county,
 * $4 division (still a no-op -- no division dropdown yet), $5 age band
 * (Custom_Age_Band, e.g. "11-20"). Callers that also filter by threshold
 * (age >= N) append it as their own extra $6 param.
 */
export function filterValues2019(f: Filters) {
  const genderValue = f.gender === "both" ? null : f.gender === "male" ? "Male" : "Female";
  return [genderValue, f.county, f.subCounty, f.division, f.ageBand];
}

// Same as filterValues2019 but forces county/sub-county to "unset" -- for
// the county choropleth maps specifically. A map showing "distribution by
// county" becomes a dead end once its own query is scoped to the single
// selected county (every other county drops out and renders grey, and after
// that there is nothing else left to click) -- so the map always shows the
// full distribution across all counties, still respecting gender/age-band,
// while tables and KPIs keep narrowing normally.
export function filterValuesMapScope2019(f: Filters) {
  const genderValue = f.gender === "both" ? null : f.gender === "male" ? "Male" : "Female";
  return [genderValue, null, null, f.division, f.ageBand];
}

// Same as filterValues2019 but forces age band to "unset" -- for widgets
// that already hard-code a specific single age (e.g. "Top sub-counties by
// age 10 population"), where the interactive age-band chip would otherwise
// silently AND the two age conditions together and produce zero rows
// whenever the selected band doesn't happen to contain that exact age.
export function filterValuesIgnoreAgeBand2019(f: Filters) {
  const genderValue = f.gender === "both" ? null : f.gender === "male" ? "Male" : "Female";
  return [genderValue, f.county, f.subCounty, f.division, null];
}

// County/sub-county comparisons go through ref.norm_county() (uppercase,
// strip non-letters) rather than plain equality: filter values come from
// ref.counties.county_name ("Baringo"), but these tables carry the raw
// source text verbatim ("BARINGO") -- a literal `=` silently matches zero
// rows for every county-scoped widget the moment a county is selected.
export const filterSql2019 = (a: string) => `
  ($1::text IS NULL OR ${a}.gender = $1::text)
  AND ($2::text IS NULL OR ref.norm_county(${a}.county) = ref.norm_county($2::text))
  AND ($3::text IS NULL OR ref.norm_county(${a}.sub_county) = ref.norm_county($3::text))
  AND ($4::text IS NULL OR true)
  AND ($5::text IS NULL OR ${a}.custom_age_band = $5::text)`;

/**
 * Positional params for the 2009 track (province/district/age-band
 * geography): $1 gender, $2 province, $3 district, $4 age band. Callers
 * that also filter by threshold (age >= N) append it as their own extra $5
 * param.
 */
export function filterValues2009(f: Filters) {
  const genderValue = f.gender === "both" ? null : f.gender === "male" ? "Male" : "Female";
  return [genderValue, f.province, f.district, f.ageBand];
}

export function filterValuesIgnoreAgeBand2009(f: Filters) {
  const genderValue = f.gender === "both" ? null : f.gender === "male" ? "Male" : "Female";
  return [genderValue, f.province, f.district, null];
}

export const filterSql2009 = (a: string) => `
  ($1::text IS NULL OR ${a}.gender = $1::text)
  AND ($2::text IS NULL OR ${a}.province = $2::text)
  AND ($3::text IS NULL OR ${a}.district = $3::text)
  AND ($4::text IS NULL OR ${a}.custom_age_band = $4::text)`;

/** Sex filter for the id-holders table, which uses single-letter "M"/"F". */
export function idHoldersSexValue(f: Filters) {
  return f.gender === "both" ? null : f.gender === "male" ? "M" : "F";
}

export const filterSqlIdHolders = (a: string) => `($1::text IS NULL OR ${a}.sex = $1::text)`;
