# Demo runbook (June 2026)

## Setup in place

- Demo database: `icta_dashboard_demo` on the shared Postgres server (20.67.245.228:15424),
  created with the `icta_data_admin` role. Fully isolated from the data team's
  `icta_dashboard` database; they can keep loading without touching the demo.
- Contents: a server-side copy of the real `analytics.icta_training_data`
  (103,267 rows, 101,430 unique learners) plus the generated sample lane and
  the dataset registry. Headline numbers are real; breakdowns marked with an
  amber dot are modeled.
- Refresh the copy any time with the dblink INSERT in this file's history, or
  re-run `node scripts/db-apply.mjs --with-sample` after a refresh.

## Run the demo

Option A, from a laptop (no server changes needed):

```bash
# .env DATABASE_URL points at icta_dashboard_demo
npm run build && PORT=3002 npm start     # or npm run dev
# open http://127.0.0.1:3002
```

Option B, live site (needs someone with server access):

```bash
ssh <server>
cd /srv/repos/icta-dashboard && git pull
# put the demo DATABASE_URL in .env (icta_dashboard_demo)
docker compose up -d --build app
# Caddy already routes icta.pathwaystechnologies.com -> icta-dashboard-app:3000
```

Before the audience joins, smoke test:

```bash
bash scripts/smoke-test.sh http://127.0.0.1:3002
```

## Talking points on data provenance

- Slate dot = actual data. Amber ring = real totals, modeled breakdown.
  Amber dot = modeled estimate. Hover any dot for the source datasets.
- The 20M progress figure and all learner/county counts are real.
- Demographics, completion and readiness figures are modeled placeholders,
  county-conditioned on KNBS/CA patterns, and will be replaced as the data
  team loads Datasets 1-7 (see the Data Quality page for live status).

## Cutover to the live DB later

When the data team is ready, run against the real database:

```bash
DATABASE_URL=<icta_dashboard url> node scripts/db-apply.mjs --with-sample
```

Then point the app's `DATABASE_URL` at `icta_dashboard` and restart. The
registry flips each dataset from sample to actual as real tables load; no
code changes are needed.
