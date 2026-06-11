# ICTA Dashboard

Executive dashboard for the ICTA–Microsoft Digital & AI Skills Training Program (20M learners by 2032). One Next.js project holds the frontend, the API routes, and reads its own PostgreSQL reporting database. Charts are eCharts.

Six pages: Executive Overview, Geographic Coverage (county map + region drilldown), Demographics & Inclusion, Training Pipeline, Course Performance, Data Quality.

Every widget carries a provenance mark (dot next to the title): slate = actual data, amber ring = actual totals with modeled breakdown, amber = modeled estimate. Provenance flows from `app.dataset_registry` through the API (`{ data, provenance }` per widget) to the UI — see `docs/plans/sample-data-lane-plan.md`. The Data Quality page shows the authoritative registry of which datasets are loaded vs modeled.

## Local development

```bash
cp .env.example .env            # set a local POSTGRES_PASSWORD and matching DATABASE_URL
docker compose up -d postgres   # init SQL creates schemas, registry, county reference data
npm install
npm run db:fixture              # DEV ONLY: synthetic stand-in for analytics.icta_training_data
npm run db:sample               # generate the sample (modeled gap-fill) lane
npm run dev                     # http://127.0.0.1:3002
```

Against production, skip `db:fixture` (the real table is loaded there) and point `DATABASE_URL` at the server. `db/sample/001_generate_sample_lane.sql` is deterministic (hash-based) and safe to re-run; it only enriches real records and updates the registry.

## Services

- `postgres`: PostgreSQL 16, exposed on `${POSTGRES_HOST_PORT:-15424}` for data-team ingestion.
- `app`: Next.js production server, reachable internally by Caddy as `icta-dashboard-app:3000`.

## First Start

```bash
cp .env.example .env
docker compose up -d postgres
```

When the app is needed:

```bash
docker compose up -d app
```

## Database

Default local connection shape:

```text
postgres://icta_dashboard:<password>@<host>:15424/icta_dashboard
```

The initial database creates these schemas for incoming work:

- `raw`: source-aligned landing tables owned by the data team.
- `staging`: normalized intermediate tables.
- `analytics`: dashboard-ready tables and views.
- `app`: application metadata and operational tables.

## Deployment Notes

Production is expected under `/srv/repos/icta-dashboard`, with Caddy routing `icta.pathwaystechnologies.com` to `icta-dashboard-app:3000` on the shared `caddy_net` Docker network.

Current production deploy flow:

```bash
git pull
# confirm .env points DATABASE_URL at the intended database
docker compose up -d --build app
docker compose ps
```

Use `icta_dashboard_demo` for demo-safe production previews. Use `icta_dashboard` only when the data team is ready for the live database to be migrated/enriched:

```bash
DATABASE_URL=<icta_dashboard url> node scripts/db-apply.mjs --with-sample
```

After a deploy, smoke test the app through Caddy:

```bash
curl -fsS https://icta.pathwaystechnologies.com/api/health
```
