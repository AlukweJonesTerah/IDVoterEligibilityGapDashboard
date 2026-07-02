"use client";

import type { ReactNode } from "react";
import { ProvenanceLegend } from "./Provenance";
import { FilterBar } from "./FilterBar";

export function PageShell({
  subtitle,
  children
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-hair bg-paperalt shadow-paper">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-x-8 gap-y-1 px-5 py-2.5 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icta-logo.png" alt="ICT Authority" className="h-10 w-auto sm:h-12" />
            <div className="border-l border-hair pl-3 sm:pl-5">
              <h1 className="text-[13px] font-semibold leading-snug tracking-tight text-ink sm:text-[15px]">
                National Digital & AI Skills Dashboard
              </h1>
              <div className="mt-0.5 whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-normal text-mute sm:text-[10.5px] sm:tracking-[0.06em]">
                ICT Authority · Microsoft
              </div>
            </div>
          </div>
          <FilterBar />
        </div>
      </header>

      <main className="px-5 py-5 sm:px-7 lg:px-10">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-5">
          {subtitle ? <p className="max-w-3xl text-sm leading-6 text-subink">{subtitle}</p> : null}

          {children}

          <footer className="border-t border-hair pb-2 pt-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <ProvenanceLegend />
              <div className="text-xs font-medium text-mute sm:text-right">
                Portal built by{" "}
                <a
                  href="https://pathwaystechnologies.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-subink underline-offset-2 hover:text-icta-red hover:underline"
                >
                  Pathways Technologies
                </a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
