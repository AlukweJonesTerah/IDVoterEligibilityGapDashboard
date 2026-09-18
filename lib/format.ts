const nf = new Intl.NumberFormat("en-KE");
const compact = new Intl.NumberFormat("en-KE", { notation: "compact", maximumFractionDigits: 0 });

export const fmt = (n: number | null | undefined) => (n == null ? "—" : nf.format(n));
export const fmtCompact = (n: number | null | undefined) => (n == null ? "—" : compact.format(n));
export const fmtPct = (n: number | null | undefined) => (n == null ? "—" : `${n}%`);

// Title-case source labels while keeping acronyms uppercase: "AI FLUENCY" ->
// "AI Fluency", "Ict skilling" -> "ICT Skilling", "TVET / CERTIFICATE" ->
// "TVET / Certificate".
const ACRONYMS = new Set(["ICT", "AI", "TVET", "PWD", "CDC", "ICTA", "MSME", "TOT", "BI", "DAX", "SQL", "API"]);
const SPECIAL: Record<string, string> = { GITHUB: "GitHub", ECITIZEN: "eCitizen", POWERPOINT: "PowerPoint" };
const MINOR = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);

export function labelCase(s: string | null | undefined): string {
  if (!s) return "—";
  let first = true;
  return s
    .split(/(\s+|\/|-)/)
    .map((part) => {
      const word = part.trim();
      if (!word || /^[\s/-]+$/.test(part)) return part;
      const upper = word.toUpperCase();
      const out = ACRONYMS.has(upper)
        ? upper
        : SPECIAL[upper]
          ? SPECIAL[upper]
          : !first && MINOR.has(word.toLowerCase())
            ? word.toLowerCase()
            : upper.charAt(0) + word.slice(1).toLowerCase();
      first = false;
      return out;
    })
    .join("");
}
