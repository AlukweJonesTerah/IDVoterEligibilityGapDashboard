"use client";

import type { ReactNode } from "react";
import Image from "next/image";

export function PageShell({
  nav,
  subtitle,
  children
}: {
  nav?: ReactNode;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-hair bg-paperalt shadow-paper">
        <div className="mx-auto flex w-full max-w-[2200px] flex-wrap items-center justify-between gap-x-8 gap-y-1 px-5 py-2.5 sm:px-7 lg:px-10">
          <div className="flex items-center gap-3 sm:gap-5">
            <div>
              <h1 className="text-[13px] font-semibold leading-snug tracking-tight text-ink sm:text-[15px]">
                ID &amp; Voter Eligibility Gap Dashboard
              </h1>
              <div className="mt-0.5 whitespace-nowrap text-[8.5px] font-semibold uppercase tracking-normal text-mute sm:text-[10.5px] sm:tracking-[0.06em]">
                Kenya 2009 &amp; 2019 Census
              </div>
            </div>
          </div>
        </div>
        {nav}
      </header>

      <main className="px-5 py-5 sm:px-7 lg:px-10">
        <div className="mx-auto flex w-full max-w-[2200px] flex-col gap-5">
          {subtitle ? <p className="max-w-3xl text-sm leading-6 text-subink">{subtitle}</p> : null}

          {children}

          <footer className="border-t border-hair pb-2 pt-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-mute">
                Sources: KNBS 2009 &amp; 2019 Census, national ID registry, IEBC registered-voter roll.
              </p>
              <div className="flex items-center gap-2 text-xs font-medium text-mute sm:justify-end">
                <span>Portal built by</span>
                <a
                  href="https://pathwaystechnologies.com"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded bg-icta-black px-2 py-1 transition-opacity hover:opacity-85"
                >
                  <Image
                    src="/Pathways-Technologies-Logo-White-Header.png"
                    alt="Pathways Technologies"
                    width={180}
                    height={55}
                    className="h-4 w-auto"
                  />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
