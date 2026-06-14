import type { NextRequest } from "next/server";
import { normSql, PROGRAMME_TABLE, personKeySql } from "./source-sql";

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

export function isUnfiltered(f: Filters) {
  return !f.county && !f.category && !f.from && !f.to;
}

/**
 * WHERE fragment applying the global filters to a table alias that has
 * county, course_category and date_trained columns ($1..$4).
 */
export const filterSql = (a: string) => `
  ($1::text IS NULL OR ${normSql(`${a}.county`)} = ${normSql("$1::text")})
  AND ($2::text IS NULL OR ${a}.course_category = $2::text)
  AND ($3::date IS NULL OR ${a}.date_trained >= $3::date)
  AND ($4::date IS NULL OR ${a}.date_trained <= $4::date)`;

/**
 * Learner-scope fragment for derived tables keyed by person_key: a person is
 * in scope when they have at least one combined-source row matching filters.
 */
export const learnerScopeSql = (a: string) => `
  ${a}.person_key IN (
    SELECT ${personKeySql("t")} FROM ${PROGRAMME_TABLE} t WHERE ${filterSql("t")}
  )`;

/**
 * WHERE fragment for the partial demographic/cohort pool. These sources carry
 * county on some records but do not carry training course category or date, and
 * they do not have a reliable shared learner key back to the combined source.
 */
export const demographicPoolFilterSql = (a: string) => `
  ($1::text IS NULL OR (${a}.county IS NOT NULL AND ${normSql(`${a}.county`)} = ${normSql("$1::text")}))`;

export function partialPoolFilterNote(f: Filters): string | null {
  const unsupported: string[] = [];
  if (f.category) unsupported.push("course category");
  if (f.from || f.to) unsupported.push("date range");
  if (unsupported.length === 0) return null;
  return `${unsupported.join(" and ")} filters cannot be applied to this partial demographic pool because the source tables do not contain those fields or a reliable shared learner key.`;
}
