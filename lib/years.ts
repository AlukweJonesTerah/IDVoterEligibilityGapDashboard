export type Year = "2019" | "2009";

// Primary threshold first (matches the report's default page), sibling
// second. 2019 projects "adult by 2026" from age >= 11 in the 2019 census
// (or the one-year-earlier 10+ sensitivity check); 2009 projects from age
// >= 1 in the 2009 census (or 0+) -- confirmed via the source report's own
// Adult_Population_2026 DAX measures.
export const THRESHOLDS: Record<Year, [string, string]> = {
  "2019": ["11", "10"],
  "2009": ["1", "0"]
};

export const PROJECTION_YEAR = 2026;

// The primary threshold ages exactly into an 18-year-old by the projection
// year (11 in 2019 + 7 -> 18; 1 in 2009 + 17 -> 18); the sibling sensitivity
// threshold is one year younger at census time, so it only reaches 17 by
// the same projection year, not 18 -- the page title must say so.
export function ageByProjectionYear(year: Year, threshold: number): number {
  return threshold + (PROJECTION_YEAR - Number(year));
}
