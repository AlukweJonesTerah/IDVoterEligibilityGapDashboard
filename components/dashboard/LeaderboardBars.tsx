"use client";

/** Plain label-plus-track ranked list (no axis, no chart canvas) -- matches
    the reference dashboard's "Course leaderboard" style: a name/value row
    over a thin progress track, sized relative to the largest row. */
export function LeaderboardBars({
  rows,
  color,
  formatter,
  onRowClick,
  activeName
}: {
  rows: { name: string; value: number }[];
  color: string;
  formatter?: (v: number) => string;
  onRowClick?: (name: string) => void;
  activeName?: string | null;
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fmtValue = formatter ?? ((v: number) => new Intl.NumberFormat("en-US").format(v));

  return (
    <div className="flex flex-col gap-3">
      {rows.map((r) => {
        const pct = Math.max(1.5, (100 * r.value) / max);
        const active = activeName === r.name;
        const dimmed = !!activeName && !active;
        return (
          <div
            key={r.name}
            role={onRowClick ? "button" : undefined}
            tabIndex={onRowClick ? 0 : undefined}
            onClick={onRowClick ? () => onRowClick(r.name) : undefined}
            onKeyDown={
              onRowClick
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") onRowClick(r.name);
                  }
                : undefined
            }
            className={`group flex flex-col gap-1 text-left ${onRowClick ? "cursor-pointer" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span
                className={`truncate ${active ? "font-semibold text-ink" : "text-subink"} ${
                  onRowClick ? "group-hover:text-ink" : ""
                }`}
              >
                {r.name}
              </span>
              <span className="tnum shrink-0 font-semibold text-ink">{fmtValue(r.value)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-hair2">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color, opacity: dimmed ? 0.35 : 1 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
