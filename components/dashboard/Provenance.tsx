"use client";

import type { Provenance } from "@/lib/provenance";

const LABELS: Record<string, string> = {
  actual: "Actual live data",
  partial: "Partial actual coverage",
  blended: "Actual totals, modeled breakdown",
  modeled: "Modeled estimate",
  unavailable: "Not available in current source data"
};

const DOT_CLASS: Record<string, string> = {
  actual: "bg-signal-slate",
  partial: "border-2 border-signal-gold bg-transparent",
  blended: "border-2 border-signal-gold bg-transparent",
  modeled: "bg-signal-gold",
  unavailable: "border-2 border-mute bg-transparent"
};

/**
 * The data-accuracy tell: a small dot next to each widget title.
 * slate = actual, amber ring = partial/blended, amber = modeled,
 * gray ring = unavailable. Hover for source detail and coverage.
 */
export function ProvenanceDot({ provenance }: { provenance?: Provenance }) {
  if (!provenance) return null;
  const { status, datasets, note, coverage } = provenance;

  return (
    <span className="group relative inline-flex items-center">
      <span className={`inline-block h-[9px] w-[9px] rounded-full ${DOT_CLASS[status]}`} aria-label={LABELS[status]} />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded border border-hair bg-ink px-3 py-2 text-left shadow-lg group-hover:block">
        <span className="block text-[11px] font-semibold text-white">{LABELS[status]}</span>
        {coverage ? <span className="mt-1 block text-[11px] leading-4 text-white/85">{coverage}</span> : null}
        {note ? <span className="mt-1 block text-[11px] leading-4 text-white/75">{note}</span> : null}
        <span className="mt-1.5 block border-t border-white/15 pt-1.5">
          {datasets.map((d) => (
            <span key={d.key} className="block text-[10.5px] text-white/65">
              {d.key} · {d.source === "none" ? "not loaded" : d.source}
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
      <span className="inline-flex items-center gap-1.5" title={LABELS.actual}>
        <span className="inline-block h-[9px] w-[9px] rounded-full bg-signal-slate" /> actual live data
      </span>
      <span className="inline-flex items-center gap-1.5" title={LABELS.partial}>
        <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-signal-gold" /> partial coverage
      </span>
      <span className="inline-flex items-center gap-1.5" title={LABELS.unavailable}>
        <span className="inline-block h-[9px] w-[9px] rounded-full border-2 border-mute" /> not in source yet
      </span>
      <span className="text-mute">hover any dot for source and coverage details</span>
    </div>
  );
}

/** Card body for metrics the current source data cannot support. */
export function UnavailableNote({ reason }: { reason: string }) {
  return (
    <div className="flex min-h-[120px] w-full flex-col items-center justify-center gap-1 overflow-hidden rounded border border-dashed border-hair2 bg-paper px-4 py-6 text-center">
      <span className="text-sm font-medium text-subink">Not available in current source data</span>
      <span className="max-w-sm text-xs leading-5 text-mute">{reason}</span>
    </div>
  );
}
