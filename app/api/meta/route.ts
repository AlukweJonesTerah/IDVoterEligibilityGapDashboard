import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Filter dropdown options for the active census track.
export async function GET(req: NextRequest) {
  return cachedJson(req, "meta", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";

    if (year === "2019") {
      const county = req.nextUrl.searchParams.get("county") || null;
      const [counties, subCounties, ageBands] = await Promise.all([
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
        )
      ]);
      return {
        counties: counties.rows.map((r) => r.county_name),
        subCounties: subCounties.rows.map((r) => r.sub_county),
        provinces: [],
        districts: [],
        ageBands: ageBands.rows.map((r) => r.band)
      };
    }

    // Districts cascade from the selected province so the two selects can
    // never be set to a non-overlapping combination.
    const province = req.nextUrl.searchParams.get("province") || null;
    const [provinces, districts, ageBands] = await Promise.all([
      db.query<{ province: string }>(`SELECT DISTINCT province FROM analytics.census2009_pop ORDER BY 1`),
      db.query<{ district: string }>(
        `SELECT DISTINCT district FROM analytics.census2009_pop
         WHERE $1::text IS NULL OR province = $1::text ORDER BY 1`,
        [province]
      ),
      db.query<{ band: string }>(
        `SELECT custom_age_band AS band FROM analytics.census2009_pop
         GROUP BY 1 ORDER BY min(age)`
      )
    ]);
    return {
      counties: [],
      subCounties: [],
      provinces: provinces.rows.map((r) => r.province),
      districts: districts.rows.map((r) => r.district),
      ageBands: ageBands.rows.map((r) => r.band)
    };
  });
}
