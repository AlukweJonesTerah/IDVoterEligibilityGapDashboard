import type { NextRequest } from "next/server";

// Global dashboard filters. Every page API accepts these as query params and
// binds them as $1..$4 in every query, so extra params start at $5.
export interface Filters {
  county: string | null;
  category: string | null;
  from: string | null;
  to: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function readFilters(req: NextRequest): Filters {
  const p = req.nextUrl.searchParams;
  const date = (v: string | null) => (v && DATE_RE.test(v) ? v : null);
  return {
    county: p.get("fcounty") || null,
    category: p.get("fcategory") || null,
    from: date(p.get("ffrom")),
    to: date(p.get("fto"))
  };
}

export const filterValues = (f: Filters) => [f.county, f.category, f.from, f.to];

/**
 * WHERE fragment applying the global filters to a table alias that has
 * county, course_category and date_trained columns ($1..$4).
 */
export const filterSql = (a: string) => `
  ($1::text IS NULL OR ref.norm_county(${a}.county) = ref.norm_county($1::text))
  AND ($2::text IS NULL OR ${a}.course_category = $2::text)
  AND ($3::date IS NULL OR ${a}.date_trained >= $3::date)
  AND ($4::date IS NULL OR ${a}.date_trained <= $4::date)`;

/**
 * Learner-scope fragment for tables keyed by unique_id only (e.g.
 * sample.learner_attributes): a learner is in scope when they have at least
 * one training record matching the filters.
 */
export const learnerScopeSql = (a: string) => `
  ${a}.unique_id IN (
    SELECT t.unique_id FROM analytics.icta_training_data t WHERE ${filterSql("t")}
  )`;
