import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Division/location options for the "Registered IDs By Administrative
// Units" / estimated-gap tables on the Admin Details pages. These come
// from analytics.id_eligibility, NOT the census tables -- it's a
// different, current-day admin-unit taxonomy (division/location names
// from the ID registry) that only ~70% text-matches the census
// sub-county names, so cascading it from anything but county_code would
// silently produce wrong lists. Shared by both years since id_eligibility
// itself carries no census year -- it's the same current snapshot either way.
async function idAdminOptions(countyCode: number | null, division: string | null) {
  const [divisions, locations] = await Promise.all([
    db.query<{ division: string }>(
      `SELECT DISTINCT division FROM analytics.id_eligibility
       WHERE ($1::int IS NULL OR county_code = $1::int) AND division IS NOT NULL
       ORDER BY 1`,
      [countyCode]
    ),
    db.query<{ location_name: string }>(
      `SELECT DISTINCT location_name FROM analytics.id_eligibility
       WHERE ($1::int IS NULL OR county_code = $1::int)
         AND ($2::text IS NULL OR division = $2::text)
         AND location_name IS NOT NULL
       ORDER BY 1`,
      [countyCode, division]
    )
  ]);
  return {
    divisions: divisions.rows.map((r) => r.division),
    locations: locations.rows.map((r) => r.location_name)
  };
}

// Filter dropdown options for the active census track.
export async function GET(req: NextRequest) {
  return cachedJson(req, "meta", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";
    const division = req.nextUrl.searchParams.get("division") || null;

    if (year === "2019") {
      const county = req.nextUrl.searchParams.get("county") || null;
      const [counties, subCounties, ageBands, countyCodeResult] = await Promise.all([
        db.query<{ county_name: string }>(`SELECT county_name FROM ref.counties ORDER BY 1`),
        // Sub-counties cascade from the selected county, mirroring the 2009
        // province -> district cascade below.
        db.query<{ sub_county: string }>(
          `SELECT DISTINCT sub_county FROM analytics.census2019_pop
           WHERE $1::text IS NULL OR ref.norm_county(county) = ref.norm_county($1::text)
           ORDER BY 1`,
          [county]
        ),
        db.query<{ band: string }>(
          `SELECT custom_age_band AS band FROM analytics.census2019_pop
           GROUP BY 1 ORDER BY min(age)`
        ),
        county
          ? db.query<{ county_code: number }>(
              `SELECT county_code FROM ref.county_lookup WHERE county_norm = ref.norm_county($1::text)`,
              [county]
            )
          : Promise.resolve({ rows: [] })
      ]);
      const countyCode = countyCodeResult.rows[0]?.county_code ?? null;
      const idAdmin = await idAdminOptions(countyCode, division);
      return {
        counties: counties.rows.map((r) => r.county_name),
        subCounties: subCounties.rows.map((r) => r.sub_county),
        provinces: [],
        districts: [],
        ageBands: ageBands.rows.map((r) => r.band),
        ...idAdmin
      };
    }

    // Districts cascade from the selected province so the two selects can
    // never be set to a non-overlapping combination.
    const province = req.nextUrl.searchParams.get("province") || null;
    const district = req.nextUrl.searchParams.get("district") || null;
    const [provinces, districts, ageBands, countyCodesResult] = await Promise.all([
      db.query<{ province: string }>(`SELECT DISTINCT province FROM analytics.census2009_pop ORDER BY 1`),
      db.query<{ district: string }>(
        `SELECT DISTINCT district FROM analytics.census2009_pop
         WHERE $1::text IS NULL OR province = $1::text ORDER BY 1`,
        [province]
      ),
      db.query<{ band: string }>(
        `SELECT custom_age_band AS band FROM analytics.census2009_pop
         GROUP BY 1 ORDER BY min(age)`
      ),
      district
        ? db.query<{ county_code: number }>(`SELECT DISTINCT county_code FROM staging.district_to_county WHERE district = $1::text`, [
            district
          ])
        : province
          ? db.query<{ county_code: number }>(
              `SELECT DISTINCT d.county_code FROM staging.district_to_county d
               JOIN raw.census2009_age_sex_province_district r ON r.district = d.district
               WHERE r.province = $1::text`,
              [province]
            )
          : Promise.resolve({ rows: [] })
    ]);
    // A province maps to several counties -- id_eligibility's division/
    // location options only cascade cleanly from a single county_code, so
    // multi-county scope (province selected, no district) shows none.
    const countyCodes = countyCodesResult.rows.map((r) => r.county_code);
    const singleCountyCode = countyCodes.length === 1 ? countyCodes[0] : null;
    const idAdmin = await idAdminOptions(singleCountyCode, division);
    return {
      counties: [],
      subCounties: [],
      provinces: provinces.rows.map((r) => r.province),
      districts: districts.rows.map((r) => r.district),
      ageBands: ageBands.rows.map((r) => r.band),
      ...idAdmin
    };
  });
}
