"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProvenanceLegend } from "./Provenance";
import { FilterBar } from "./FilterBar";

const PAGES = [
  { href: "/", label: "Executive Overview" },
  { href: "/courses", label: "Courses & Pipeline" },
  { href: "/geography", label: "Geographic Coverage" },
  { href: "/demographics", label: "Demographics & Inclusion" }
];

export function PageShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="border-b border-hair bg-paperalt shadow-paper">
        <div className="mx-auto flex max-w-[1560px] flex-wrap items-center justify-between gap-4 px-5 pb-3 pt-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3 sm:gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icta-logo.png" alt="ICT Authority" className="h-10 w-auto sm:h-16" />
            <div className="border-l border-hair pl-3 sm:pl-5">
              <div className="text-[13px] font-semibold leading-snug tracking-tight text-ink sm:text-[15px]">
                National Digital & AI Skills Dashboard
              </div>
              <div className="mt-0.5 whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-normal text-mute sm:mt-1 sm:text-[10.5px] sm:tracking-[0.06em]">
                ICT Authority · Microsoft
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto flex max-w-[1560px] flex-col px-5 sm:px-7 lg:px-10 xl:flex-row xl:items-center xl:justify-between xl:gap-8">
          <nav className="-mb-px flex min-w-0 gap-1 overflow-x-auto">
            {PAGES.map((p) => {
              const active = pathname === p.href;
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`shrink-0 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1.5 text-[13px] transition-colors ${
                    active
                      ? "border-icta-red font-semibold text-ink"
                      : "border-transparent text-mute hover:border-hair hover:text-ink"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </nav>
          <div className="shrink-0 border-t border-hair2 xl:border-0">
            <FilterBar />
          </div>
        </div>
      </header>

      <main className="px-5 py-5 sm:px-7 lg:px-10">
        <div className="mx-auto flex max-w-[1560px] flex-col gap-5">
          <div>
            <h1 className="text-xl font-semibold text-ink md:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-subink">{subtitle}</p> : null}
          </div>

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
