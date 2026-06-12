"use client";

import type { Provenance } from "@/lib/provenance";

const LABELS: Record<string, string> = {
  actual: "Actual data",
  blended: "Actual totals, modeled breakdown",
  modeled: "Modeled estimate"
};

/**
 * The subtle tell: a small dot next to each widget title.
 * slate = actual, amber ring = blended, amber = modeled. Hover for detail.
 */
export function ProvenanceDot({ provenance }: { provenance?: Provenance }) {
  if (!provenance) return null;
  const { status, datasets, note } = provenance;

  const dotClass =
    status === "actual"
      ? "bg-signal-slate"
      : status === "blended"
        ? "border-2 border-signal-gold bg-transparent"
        : "bg-signal-gold";

  return (
    <span className="group relative inline-flex items-center">
      <span className={`inline-block h-[9px] w-[9px] rounded-full ${dotClass}`} aria-label={LABELS[status]} />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded border border-hair bg-ink px-3 py-2 text-left shadow-lg group-hover:block">
        <span className="block text-[11px] font-semibold text-white">{LABELS[status]}</span>
        {note ? <span className="mt-1 block text-[11px] leading-4 text-white/75">{note}</span> : null}
        <span className="mt-1.5 block border-t border-white/15 pt-1.5">
          {datasets.map((d) => (
            <span key={d.key} className="block text-[10.5px] text-white/65">
              {d.key} · {d.source}
              {d.as_of ? ` · as of ${d.as_of}` : ""}
            </span>
          ))}
        </span>
      </span>
    </span>
  );
}

export function ProvenanceLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subink">
      <span className="font-semibold text-mute">Data source key:</span>
      <span className="inline-flex items-center gap-1.5" title="Actual data">
        <span className="inline-block h-[9px] w-[9px] rounded-full bg-signal-slate" /> actual
      </span>
      <span className="inline-flex items-center gap-1.5" title="Actual total, modeled breakdown">
        <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-signal-gold" /> actual totals,
        modeled breakdown
      </span>
      <span className="inline-flex items-center gap-1.5" title="Modeled estimate">
        <span className="inline-block h-[9px] w-[9px] rounded-full bg-signal-gold" /> modeled estimate
      </span>
      <span className="text-mute">hover any dot for details · full registry on the Data Quality page</span>
    </div>
  );
}
