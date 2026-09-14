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
