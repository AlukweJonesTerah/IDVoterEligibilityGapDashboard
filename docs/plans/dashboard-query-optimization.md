# Dashboard Query Optimization

Prepared: 2026-06-14, Africa/Nairobi

## Why we are doing this

The dashboard now reads from one live source table:

`analytics."20_million_by_2032"`

That table is the source of truth, but the dashboard does not need to recalculate every headline number from the raw table every time a user opens a tab. The slowest pages were doing repeated work:

- deduplicating people across national ID, phone, email, survey UUID and record ID
- normalizing counties into Kenya's 47 official counties
- grouping by gender, age, disability, education, courses and cohorts
- scanning completion fields

Indexes helped filtered views, but unfiltered first loads were still slow because the app was calculating the same national summaries repeatedly.

## What we changed in the DB

We added a dashboard optimization layer under the same `analytics` schema.

The raw source table remains unchanged:

`analytics."20_million_by_2032"`

The new materialized views are derived from that table:

| Object | Purpose |
| --- | --- |
| `analytics.dashboard_people_mv` | One deduplicated row per person for fast demographic summaries |
| `analytics.dashboard_overview_summary_mv` | One-row national headline summary |
| `analytics.dashboard_partner_summary_mv` | Partner and programme-stream record comparison |
| `analytics.dashboard_county_summary_mv` | Official 47-county reach summary |
| `analytics.dashboard_course_category_summary_mv` | Training course-category totals |
| `analytics.dashboard_course_summary_mv` | Training course leaderboard totals |
| `analytics.dashboard_gender_summary_mv` | Gender distribution |
| `analytics.dashboard_age_summary_mv` | Age-band distribution |
| `analytics.dashboard_disability_summary_mv` | Disability distribution |
| `analytics.dashboard_education_summary_mv` | Education-level distribution |
| `analytics.dashboard_device_summary_mv` | Device availability distribution |
| `analytics.dashboard_pipeline_summary_mv` | Training funnel and completion-field counts |
| `analytics.dashboard_completion_trend_mv` | Completion records by date |
| `analytics.dashboard_cohort_summary_mv` | Cohort counts |
| `analytics.dashboard_pipeline_daily_activity_mv` | Daily training activity |

Setup SQL:

`db/live/003_dashboard_optimization_views.sql`

Refresh SQL:

`db/live/004_refresh_dashboard_optimization_views.sql`

## What changed in the app

The app now uses the materialized views only when there are no active filters.

Default page loads use summaries:

- Executive Overview
- Geographic Coverage
- Courses & Pipeline
- Demographics & Inclusion
- Filter metadata

Filtered views still query the raw table so that county, category and date filters remain accurate.

This gives the best tradeoff:

- fast first load for the common national view
- accurate filtered drilldowns
- raw table remains the audit source

## Refresh process after new data lands

When the data team reloads `analytics."20_million_by_2032"`, run:

```bash
bun run db:check
bun run db:refresh
```

`db:check` is read-only and reports raw versus summarized row counts. `db:refresh` uses the configured `DATABASE_URL` and refreshes the views in dependency order.

If a release changes `db/live/003_dashboard_optimization_views.sql`, rebuild the definitions once before routine refreshes:

```bash
bun run db:views
```

The refresh order matters because several summary views depend on `analytics.dashboard_people_mv`.

## Why not replace the raw table

The materialized views are not the source of truth. They are dashboard accelerators.

The source of truth remains:

`analytics."20_million_by_2032"`

If there is ever a discrepancy, validate against the raw table first, then refresh the materialized views.

## Expected effect

Before this optimization, unfiltered API calls could take several seconds because each request recalculated summaries from the raw table.

After this optimization, default dashboard tabs should load from small precomputed views. Filtered drilldowns may still take longer because they query the raw table, but those are now helped by indexes and the app cache.

## Measured improvement

Measured locally against the live `icta_dashboard` database on 2026-06-14, using cache-busting query parameters so the app API cache did not hide the DB/query cost.

| API route | Before materialized views | After materialized views | Improvement |
| --- | ---: | ---: | ---: |
| `/api/overview` | 13.27s | 1.49s | 88.8% faster |
| `/api/geography` | 1.97s | 0.29s | 85.4% faster |
| `/api/demographics` | 7.65s | 0.85s | 88.9% faster |
| `/api/courses` | 2.20s | 0.29s | 87.0% faster |
| `/api/pipeline` | 1.60s | 0.84s | 47.5% faster |

The app-level cache still applies after this. Once a route is warm, repeated API calls were observed around 0.003s locally because they return from memory.

The largest gains are on the Executive Overview and Demographics pages because those previously repeated the expensive person deduplication and demographic coverage calculations on every request.

## Operational note

The app also has a short API cache controlled by:

`ICTA_API_CACHE_TTL_MS`

Default: 5 minutes.

Set it to `0` only if immediate row-level freshness matters more than navigation speed.
