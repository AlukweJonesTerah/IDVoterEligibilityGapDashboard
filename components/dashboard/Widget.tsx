"use client";

import type { ReactNode } from "react";
import type { Provenance } from "@/lib/provenance";
import { ProvenanceDot } from "./Provenance";

export function Widget({
  title,
  provenance,
  children,
  className = "",
  right
}: {
  title: string;
  provenance?: Provenance;
  children: ReactNode;
  className?: string;
  right?: ReactNode;
}) {
  return (
    <article className={`rounded border border-hair bg-paperalt p-4 shadow-card ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="section-title inline-flex items-center gap-2">
          {title}
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
  provenance
}: {
  label: string;
  value: string;
  sub?: string;
  provenance?: Provenance;
}) {
  return (
    <article className="rounded border border-hair bg-paperalt px-4 py-3 shadow-card">
      <div className="flex items-center gap-2">
        <span className="eyebrow">{label}</span>
        <ProvenanceDot provenance={provenance} />
      </div>
      <div className="tnum mt-1.5 text-[22px] font-semibold leading-7 text-ink">{value}</div>
      {sub ? <div className="mt-0.5 text-[11px] text-mute">{sub}</div> : null}
    </article>
  );
}
