import { Database, RadioTower } from "lucide-react";
import { EChart } from "@/components/charts/EChart";
import { placeholderOption } from "@/lib/charts/placeholder-option";

export default function Home() {
  return (
    <main className="min-h-screen px-5 py-5 sm:px-7 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <header className="flex flex-col gap-4 border-b border-hair pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="eyebrow">ICT Authority</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-ink md:text-3xl">
              ICTA Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-subink">
              Reporting database is ready for ingestion. Dashboard modules will appear here as
              source tables and metrics are confirmed.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded border border-hair bg-paperalt px-3 py-2 text-xs font-medium text-subink shadow-paper">
            <span className="h-2 w-2 rounded-full bg-icta-green pulse-dot" />
            Waiting for first data feed
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded border border-hair bg-paperalt p-4 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Database size={16} className="text-icta-greenDeep" />
              PostgreSQL 16
            </div>
            <p className="mt-3 text-sm leading-6 text-subink">
              Owned dashboard database with raw, staging, analytics, and app schemas initialized.
            </p>
          </article>

          <article className="rounded border border-hair bg-paperalt p-4 shadow-card">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <RadioTower size={16} className="text-icta-blue" />
              Next.js + eCharts
            </div>
            <p className="mt-3 text-sm leading-6 text-subink">
              Combined frontend and backend project, ready for API routes and dashboard charts.
            </p>
          </article>
        </section>

        <section className="rounded border border-hair bg-paperalt p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="section-title">Placeholder chart surface</h2>
            <span className="rounded border border-hair2 bg-icta-blueSoft px-2 py-1 text-xs font-medium text-icta-blue">
              eCharts
            </span>
          </div>
          <EChart option={placeholderOption} height={260} />
        </section>
      </div>
    </main>
  );
}
