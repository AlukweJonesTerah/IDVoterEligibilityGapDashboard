import { NextRequest } from "next/server";
import { cachedJson } from "@/lib/api-cache";
import { adminDrillLevel, ADMIN_DRILL_LEVELS, type AdminDrillLevel } from "@/lib/queries/id-gap";
import { THRESHOLDS } from "@/lib/years";

export const dynamic = "force-dynamic";

// Backs the Admin Details pages' "Adult Population" decomposition tree
// (AdminDrillTree component) -- the corrected analog of the source report's
// own decomposition tree, whose nodes all showed the same parent total
// repeated at every depth instead of each node's own aggregate. Each step
// here re-derives a real sum via lib/queries/id-gap.ts#adminDrillLevel.
//
// `level` is the column being fetched (root omits it and returns county);
// the ancestor params (`county`, `subcounty`, `division`) scope it -- the
// full path, not just the immediate parent, since division/location names
// repeat across different counties (e.g. many counties have a "CENTRAL"
// division) and filtering by just the clicked name would silently mix rows
// from unrelated counties together.
export async function GET(req: NextRequest) {
  return cachedJson(req, "admin-drill", async () => {
    const year = req.nextUrl.searchParams.get("year") === "2009" ? "2009" : "2019";
    const rawThreshold = Number(req.nextUrl.searchParams.get("threshold"));
    const threshold = THRESHOLDS[year].includes(String(rawThreshold)) ? rawThreshold : Number(THRESHOLDS[year][0]);
    const levelParam = req.nextUrl.searchParams.get("level");
    const level: AdminDrillLevel = (ADMIN_DRILL_LEVELS as string[]).includes(levelParam ?? "") ? (levelParam as AdminDrillLevel) : "county";

    const ancestors = {
      county: req.nextUrl.searchParams.get("county") || undefined,
      subcounty: req.nextUrl.searchParams.get("subcounty") || undefined,
      division: req.nextUrl.searchParams.get("division") || undefined
    };

    const data = await adminDrillLevel(year, threshold, level, ancestors);
    const levelIndex = ADMIN_DRILL_LEVELS.indexOf(level);
    const nextLevel = levelIndex >= 0 && levelIndex < ADMIN_DRILL_LEVELS.length - 1 ? ADMIN_DRILL_LEVELS[levelIndex + 1] : null;
    return { data, nextLevel };
  });
}
