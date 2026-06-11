const nf = new Intl.NumberFormat("en-KE");
const compact = new Intl.NumberFormat("en-KE", { notation: "compact", maximumFractionDigits: 1 });

export const fmt = (n: number | null | undefined) => (n == null ? "—" : nf.format(n));
export const fmtCompact = (n: number | null | undefined) => (n == null ? "—" : compact.format(n));
export const fmtPct = (n: number | null | undefined) => (n == null ? "—" : `${n}%`);
