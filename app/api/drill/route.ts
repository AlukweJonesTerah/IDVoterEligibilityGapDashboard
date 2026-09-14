import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Backs the Overview page's decomposition-tree analog (DrillExplorer): one
// level at a time, given the parent node already selected.
//
// 2019 is two levels deep (county then sub-county). 2009 is confirmed
// (directly against the source report's own decomposition tree) to be
// THREE levels -- province, then county, then district -- with the middle
// "county" level interposed via the district/county reconciliation mapping
// (staging.district_to_county, already joined into analytics.census2009_pop
// as county_name). `level` disambiguates the 2009 county vs. district step
// since both are reached via a `parent` name.
export async function GET(req: NextRequest) {
  return cachedJson(req, "drill", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";
    const parent = req.nextUrl.searchParams.get("parent");
    const level = req.nextUrl.searchParams.get("level");

    if (year === "2019") {
      const rows = parent
        ? await db.query<{ name: string; v: string }>(
            `SELECT sub_county AS name, sum(population)::text AS v FROM analytics.census2019_pop
             WHERE county = $1::text GROUP BY 1 ORDER BY sum(population) DESC`,
            [parent]
          )
        : await db.query<{ name: string; v: string }>(
            `SELECT county AS name, sum(population)::text AS v FROM analytics.census2019_pop
             GROUP BY 1 ORDER BY sum(population) DESC`
          );
      return { data: rows.rows.map((r) => ({ name: r.name, value: Number(r.v) })), nextLevel: parent ? null : "sub-county" };
    }

    if (!parent) {
      const rows = await db.query<{ name: string; v: string }>(
        `SELECT province AS name, sum(population)::text AS v FROM analytics.census2009_pop
         GROUP BY 1 ORDER BY sum(population) DESC`
      );
      return { data: rows.rows.map((r) => ({ name: r.name, value: Number(r.v) })), nextLevel: "county" };
    }

    if (level === "county") {
      const rows = await db.query<{ name: string; v: string }>(
        `SELECT county_name AS name, sum(population)::text AS v FROM analytics.census2009_pop
         WHERE province = $1::text GROUP BY 1 ORDER BY sum(population) DESC`,
        [parent]
      );
      return { data: rows.rows.map((r) => ({ name: r.name, value: Number(r.v) })), nextLevel: "district" };
    }

    const rows = await db.query<{ name: string; v: string }>(
      `SELECT district AS name, sum(population)::text AS v FROM analytics.census2009_pop
       WHERE county_name = $1::text GROUP BY 1 ORDER BY sum(population) DESC`,
      [parent]
    );
    return { data: rows.rows.map((r) => ({ name: r.name, value: Number(r.v) })), nextLevel: null };
  });
}
