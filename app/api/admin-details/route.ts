import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";
import { readFilters } from "@/lib/filters-server";
import { locationIdGapEstimate2009, locationIdGapEstimate2019 } from "@/lib/queries/id-gap";
import { THRESHOLDS } from "@/lib/years";

export const dynamic = "force-dynamic";

// Field wells confirmed directly from the source report (Report/Layout) for
// 2019, and directly from screenshots of the live 2009 "0+"/"1+"
// Administrative Details pages (the 2009 track's grain is coarser than
// 2019's): the "Adult Population" pivot is the census age table's
// threshold-specific Adult_Population_2026 measure (age >= threshold), rows
// county -> sub-county for 2019, but a FLAT county-only list for 2009 (no
// sub-county expand -- 2009's own geography is province/district, so the
// widget instead rolls straight up to the modern county). "Registered IDs
// By Administrative Units" is STATISTIC22_02_26ALL (analytics.id_holders
// here): county/subcounty/division/location for 2019, but rolled up to
// just province/county for 2009 -- a different table from
// analytics.id_eligibility, which this route does not use at all.
//
// analytics.id_holders has no per-threshold/gender split and no
// district link, so it's always the same national snapshot regardless of
// year/threshold/gender -- only the admin-unit filter narrows it (`countyOnly`).
//
// `locationGapTable` goes beyond the source report: it estimates an
// adult-ID gap down to LOCATION level (see lib/queries/id-gap.ts), which the
// report itself cannot do -- its own Administrative Details pages stop at
// exact ID-holder counts per location with no adult-population comparison
// ("to drill this further we need age at the ward level"). This is an
// apportioned ESTIMATE, not a census figure, and uses analytics.id_eligibility
// (not analytics.id_holders, a different, sparser extraction of the same ID
// registry -- see its own doc comment) so its population/id-holder pair are
// always self-consistent. It must never feed registeredIdsTable's totals.
export async function GET(req: NextRequest) {
  return cachedJson(req, "admin-details", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";
    const rawThreshold = Number(req.nextUrl.searchParams.get("threshold"));
    const threshold = THRESHOLDS[year].includes(String(rawThreshold)) ? rawThreshold : Number(THRESHOLDS[year][0]);
    const filters = readFilters(req);

    // Resolve the filter down to a set of county codes (or null = all).
    let countyCodesQuery: Promise<{ rows: { county_code: number }[] }>;
    if (year === "2019" && filters.county) {
      countyCodesQuery = db.query(
        `SELECT county_code FROM ref.county_lookup WHERE county_norm = ref.norm_county($1::text)`,
        [filters.county]
      );
    } else if (year === "2009" && filters.district) {
      countyCodesQuery = db.query(
        `SELECT DISTINCT county_code FROM staging.district_to_county WHERE district = $1::text`,
        [filters.district]
      );
    } else if (year === "2009" && filters.province) {
      countyCodesQuery = db.query(
        `SELECT DISTINCT d.county_code FROM staging.district_to_county d
         JOIN raw.census2009_age_sex_province_district r ON r.district = d.district
         WHERE r.province = $1::text`,
        [filters.province]
      );
    } else {
      countyCodesQuery = Promise.resolve({ rows: [] });
    }

    const countyCodesResult = await countyCodesQuery;
    const countyCodes = countyCodesResult.rows.map((r) => r.county_code);
    const hasScope = countyCodes.length > 0;

    if (year === "2019") {
      const [adultPop, registeredIds, registeredIdsTotal, locationGap] = await Promise.all([
        db.query<{ county: string; sub_county: string; v: string }>(
          `SELECT county, sub_county, sum(population)::text AS v
           FROM analytics.census2019_pop
           WHERE age >= $3 AND ($1::boolean = false OR county_code = ANY($2::int[]))
           GROUP BY county, sub_county
           ORDER BY county, sub_county`,
          [hasScope, countyCodes, threshold]
        ),
        // There are ~5,300 distinct locations nationally -- more than fit
        // in one page, so this returns only the top 2000 by ID-holder
        // count. The grand total below is a SEPARATE, unlimited aggregate:
        // summing just these displayed rows would silently undercount the
        // "Registered National IDs" headline figure by omitting the long
        // tail of smaller locations (confirmed: doing so undercounts by
        // ~5.8M, about 17%, against the true national total).
        db.query<{ county: string; subcounty: string; division: string; location: string; v: string }>(
          `SELECT county, subcounty, division, location, sum(total)::text AS v
           FROM analytics.id_holders
           WHERE $1::boolean = false OR county_code = ANY($2::int[])
           GROUP BY county, subcounty, division, location
           ORDER BY sum(total) DESC
           LIMIT 2000`,
          [hasScope, countyCodes]
        ),
        db.query<{ v: string }>(
          `SELECT sum(total)::text AS v FROM analytics.id_holders
           WHERE $1::boolean = false OR county_code = ANY($2::int[])`,
          [hasScope, countyCodes]
        ),
        locationIdGapEstimate2019(threshold, hasScope, countyCodes)
      ]);

      return {
        widgets: {
          threshold: { data: threshold },
          countyOnly: { data: true },
          adultPopulationPivot: {
            data: adultPop.rows.map((r) => ({ name: r.sub_county, county: r.county, population: Number(r.v) }))
          },
          registeredIdsTable: {
            data: registeredIds.rows.map((r) => ({
              name: r.location,
              county: r.county,
              subcounty: r.subcounty,
              division: r.division,
              idHolders: Number(r.v)
            })),
            total: Number(registeredIdsTotal.rows[0]?.v ?? 0)
          },
          locationGapTable: {
            data: locationGap.rows,
            totalPopulation: locationGap.totalPopulation,
            totalIdHolders: locationGap.totalIdHolders,
            totalEstimatedAdults: locationGap.totalEstimatedAdults,
            totalEstimatedGap: locationGap.totalEstimatedGap
          }
        }
      };
    }

    const [adultPop, registeredIds, locationGap] = await Promise.all([
      db.query<{ county_name: string; v: string }>(
        `SELECT county_name, sum(population)::text AS v
         FROM analytics.census2009_pop
         WHERE age >= $3 AND ($1::boolean = false OR county_code = ANY($2::int[]))
         GROUP BY county_name
         ORDER BY county_name`,
        [hasScope, countyCodes, threshold]
      ),
      db.query<{ province: string; county: string; v: string }>(
        `SELECT c.former_province AS province, c.county_name AS county, sum(h.total)::text AS v
         FROM analytics.id_holders h
         JOIN ref.counties c ON c.county_code = h.county_code
         WHERE $1::boolean = false OR h.county_code = ANY($2::int[])
         GROUP BY c.former_province, c.county_name
         ORDER BY sum(h.total) DESC`,
        [hasScope, countyCodes]
      ),
      locationIdGapEstimate2009(threshold, hasScope, countyCodes)
    ]);

    return {
      widgets: {
        threshold: { data: threshold },
        countyOnly: { data: true },
        adultPopulationPivot: {
          data: adultPop.rows.map((r) => ({ name: r.county_name, population: Number(r.v) }))
        },
        registeredIdsTable: {
          data: registeredIds.rows.map((r) => ({
            name: r.county,
            province: r.province,
            idHolders: Number(r.v)
          })),
          total: registeredIds.rows.reduce((s, r) => s + Number(r.v), 0)
        },
        locationGapTable: {
          data: locationGap.rows,
          totalPopulation: locationGap.totalPopulation,
          totalIdHolders: locationGap.totalIdHolders,
          totalEstimatedAdults: locationGap.totalEstimatedAdults,
          totalEstimatedGap: locationGap.totalEstimatedGap
        }
      }
    };
  });
}
