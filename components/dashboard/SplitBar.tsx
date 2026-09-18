"use client";

/** Single track split into colored segments by share, with a dot-legend
    row below -- matches the reference dashboard's "Gender split" widget. */
export function SplitBar({
  rows,
  colors,
  onSegmentClick,
  activeName
}: {
  rows: { name: string; value: number }[];
  colors: string[];
  onSegmentClick?: (name: string) => void;
  activeName?: string | null;
}) {
  const total = rows.reduce((s, r) => s + r.value, 0) || 1;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-7 w-full overflow-hidden rounded">
        {rows.map((r, i) => {
          const active = activeName === r.name;
          const dimmed = !!activeName && !active;
          return (
            <div
              key={r.name}
              role={onSegmentClick ? "button" : undefined}
              tabIndex={onSegmentClick ? 0 : undefined}
              onClick={onSegmentClick ? () => onSegmentClick(r.name) : undefined}
              className={onSegmentClick ? "cursor-pointer" : ""}
              style={{
                width: `${(100 * r.value) / total}%`,
                backgroundColor: colors[i % colors.length],
                opacity: dimmed ? 0.45 : 1
              }}
              title={`${r.name}: ${new Intl.NumberFormat("en-US").format(r.value)}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
        {rows.map((r, i) => {
          const pct = (100 * r.value) / total;
          return (
            <span key={r.name} className="inline-flex items-center gap-1.5 text-subink">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
              {r.name} &middot; {pct.toFixed(0)}%
            </span>
          );
        })}
      </div>
    </div>
  );
}
