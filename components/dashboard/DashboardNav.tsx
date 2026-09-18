"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { THRESHOLDS, type Year } from "@/lib/years";

const FAMILIES = [
  { key: "overview", label: "Overview" },
  { key: "eligibility", label: "Eligibility" },
  { key: "admin", label: "Admin Details" },
  { key: "voters", label: "Registered Voters" }
] as const;

function currentFamily(parts: string[]): (typeof FAMILIES)[number]["key"] {
  const f = parts[1];
  if (f === "eligibility" || f === "admin" || f === "voters") return f;
  return "overview";
}

function hrefFor(year: Year, family: (typeof FAMILIES)[number]["key"], threshold: string) {
  if (family === "overview") return `/${year}`;
  if (family === "voters") return `/${year}/voters`;
  return `/${year}/${family}/${threshold}`;
}

// All four threshold+year combos; filtered down to the current year's pair
// when rendered ("0+"/"1+" for 2009, "10+"/"11+" for 2019) so the strip only
// ever shows thresholds that apply to the census currently on screen.
const ALL_THRESHOLDS: { year: Year; threshold: string; label: string }[] = [
  { year: "2009", threshold: "0", label: "0+" },
  { year: "2009", threshold: "1", label: "1+" },
  { year: "2019", threshold: "10", label: "10+" },
  { year: "2019", threshold: "11", label: "11+" }
];

export function DashboardNav({ year }: { year: Year }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const family = currentFamily(parts);
  const threshold = parts[2] ?? THRESHOLDS[year][0];
  const otherYear: Year = year === "2019" ? "2009" : "2019";
  const showThreshold = family === "eligibility" || family === "admin";

  const tabClass = (active: boolean) =>
    `rounded px-2.5 py-1 text-xs font-medium transition-colors ${
      active ? "bg-icta-black text-white" : "text-subink hover:bg-paper"
    }`;

  return (
    <div className="border-t border-hair bg-paper">
      <div className="mx-auto flex w-full max-w-[2200px] flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-5 py-1.5 sm:px-7 lg:px-10">
        <div className="flex items-center gap-1 rounded border border-hair bg-paperalt p-0.5">
          {(["2019", "2009"] as Year[]).map((y) => (
            <Link key={y} href={hrefFor(y, family, THRESHOLDS[y][0])} className={tabClass(y === year)}>
              {y} Census
            </Link>
          ))}
        </div>

        <nav className="flex flex-wrap items-center gap-1">
          {FAMILIES.map((f) => (
            <Link key={f.key} href={hrefFor(year, f.key, threshold)} className={tabClass(f.key === family)}>
              {f.label}
            </Link>
          ))}
        </nav>

        {showThreshold ? (
          <div className="flex items-center gap-1 rounded border border-hair bg-paperalt p-0.5">
            {ALL_THRESHOLDS.filter((t) => t.year === year).map((t) => (
              <Link
                key={`${t.year}-${t.threshold}`}
                href={hrefFor(t.year, family, t.threshold)}
                className={tabClass(t.threshold === threshold)}
                title={`${t.label} (${t.year} census)`}
              >
                {t.label}
              </Link>
            ))}
          </div>
        ) : null}

        <span className="ml-auto text-[11px] text-mute">
          Switch census: <Link href={hrefFor(otherYear, family, THRESHOLDS[otherYear][0])} className="underline hover:text-ink">{otherYear}</Link>
        </span>
      </div>
    </div>
  );
}
