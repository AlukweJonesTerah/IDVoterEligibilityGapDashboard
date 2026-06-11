"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ProvenanceLegend } from "./Provenance";

const PAGES = [
  { href: "/", label: "Executive Overview" },
  { href: "/geography", label: "Geographic Coverage" },
  { href: "/demographics", label: "Demographics & Inclusion" },
  { href: "/pipeline", label: "Training Pipeline" },
  { href: "/courses", label: "Course Performance" },
  { href: "/quality", label: "Data Quality" }
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
    <main className="min-h-screen px-5 py-5 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="border-b border-hair pb-0">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div className="flex items-start gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icta-logo.png" alt="ICT Authority" className="mt-1 h-12 w-auto shrink-0" />
              <div>
                <div className="eyebrow">ICT Authority · Microsoft · Pathways Technologies</div>
                <h1 className="mt-1 text-xl font-semibold text-ink md:text-2xl">{title}</h1>
                {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-subink">{subtitle}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2 rounded border border-hair bg-paperalt px-3 py-1.5 text-xs font-medium text-subink shadow-paper">
              <span className="h-2 w-2 rounded-full bg-icta-red pulse-dot" />
              Digital & AI Skills Training Program
            </div>
          </div>
          <nav className="mt-4 flex flex-wrap gap-1 text-[13px]">
            {PAGES.map((p) => {
              const active = pathname === p.href;
              return (
                <Link
                  key={p.href}
                  href={p.href}
                  className={`rounded-t border-x border-t px-3 py-1.5 ${
                    active
                      ? "border-hair bg-paperalt font-semibold text-icta-redDeep"
                      : "border-transparent text-mute hover:text-ink"
                  }`}
                >
                  {p.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {children}

        <footer className="border-t border-hair pt-3 pb-2">
          <ProvenanceLegend />
        </footer>
      </div>
    </main>
  );
}
