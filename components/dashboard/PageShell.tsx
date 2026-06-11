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
    <div className="min-h-screen">
      <header className="border-b border-hair bg-paperalt shadow-paper">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 pb-3 pt-4 sm:px-7 lg:px-10">
          <div className="flex items-center gap-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icta-logo.png" alt="ICT Authority" className="h-16 w-auto" />
            <div className="border-l border-hair pl-5">
              <div className="text-[15px] font-semibold leading-5 tracking-tight text-ink">
                National Digital & AI Skills Dashboard
              </div>
              <div className="eyebrow mt-1">ICT Authority · Microsoft · Pathways Technologies</div>
            </div>
          </div>
        </div>
        <nav className="mx-auto -mb-px flex max-w-7xl flex-wrap gap-1 px-5 sm:px-7 lg:px-10">
          {PAGES.map((p) => {
            const active = pathname === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                className={`border-b-2 px-3 pb-2.5 pt-1.5 text-[13px] transition-colors ${
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
      </header>

      <main className="px-5 py-5 sm:px-7 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-5">
          <div>
            <h1 className="text-xl font-semibold text-ink md:text-2xl">{title}</h1>
            {subtitle ? <p className="mt-1 max-w-3xl text-sm leading-6 text-subink">{subtitle}</p> : null}
          </div>

          {children}

          <footer className="border-t border-hair pt-3 pb-2">
            <ProvenanceLegend />
          </footer>
        </div>
      </main>
    </div>
  );
}
