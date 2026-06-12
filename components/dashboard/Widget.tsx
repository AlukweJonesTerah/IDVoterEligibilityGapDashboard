"use client";

import type { ReactNode } from "react";
import { Info } from "lucide-react";
import type { Provenance } from "@/lib/provenance";
import { ProvenanceDot } from "./Provenance";

/** Hover explainer for a widget; same popover treatment as the provenance dot. */
export function HelpTip({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="group relative inline-flex items-center">
      <Info size={13} className="cursor-help text-mute transition-colors group-hover:text-ink" aria-label="What this shows" />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded border border-hair bg-ink px-3 py-2 text-left shadow-lg group-hover:block">
        <span className="block text-[11px] font-semibold text-white">What this shows</span>
        <span className="mt-1 block text-[11px] leading-4 text-white/80">{text}</span>
      </span>
    </span>
  );
}

export function Widget({
  title,
  provenance,
  children,
  className = "",
  right,
  help
}: {
  title: string;
  provenance?: Provenance;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
  help?: string;
}) {
  return (
    <article className={`rounded border border-hair bg-paperalt p-4 shadow-card ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title inline-flex items-center gap-2">
          {title}
          <HelpTip text={help} />
          <ProvenanceDot provenance={provenance} />
        </h2>
        {right}
      </div>
      {children}
    </article>
  );
}

export function Kpi({
  label,
  value,
  sub,
  provenance,
  compact = false,
  help
}: {
  label: string;
  value: string;
  sub?: string;
  provenance?: Provenance;
  compact?: boolean;
  help?: string;
}) {
  return (
    <article className={`rounded border border-hair bg-paperalt shadow-card ${compact ? "px-4 py-2" : "px-4 py-3"}`}>
      <div className="flex items-center gap-2">
        <span className="eyebrow">{label}</span>
        <HelpTip text={help} />
        <ProvenanceDot provenance={provenance} />
      </div>
      <div className={`tnum font-semibold text-ink ${compact ? "mt-0.5 text-lg leading-6" : "mt-1.5 text-[22px] leading-7"}`}>
        {value}
      </div>
      {sub ? <div className="mt-0.5 text-[11px] text-mute">{sub}</div> : null}
    </article>
  );
}
