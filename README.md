# ICTA Dashboard

Next.js dashboard shell for ICT Authority reporting. The app keeps frontend and backend routes in one Next.js project, uses PostgreSQL as the owned reporting database, and keeps eCharts available for dashboard visualizations.

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
