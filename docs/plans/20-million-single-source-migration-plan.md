# 20 Million Single Source Migration Plan

Prepared: 2026-06-14, Africa/Nairobi

## Why this migration is needed

The ICTA dashboard currently reads from a mixed reporting layer: `analytics.icta_training_data`, staging tables, registry rows, and modeled/sample tables used to fill gaps for demo readiness. The data team has now provided a combined table, `analytics."20_million_by_2032"`, and the table name is expected to remain stable.

The dashboard should therefore move to one source of truth for live stakeholder reporting. This reduces ambiguity between training, citizen onboarding, KICTANET cluster data, and historical demo/sample layers. It also means row-level refreshes made by the data team can be picked up by the dashboard without a redeploy, as long as the table name and compatible columns remain in place.

## Current observed DB state

This must be re-verified by the implementer before changing production. As last checked on 2026-06-14, the live `icta_dashboard` database had:

| Table | Rows observed | Notes |
| --- | ---: | --- |
| `analytics."20_million_by_2032"` | 221,785 | Combined source requested for dashboard migration |
| `analytics.master_training_register_phase1` | 104,207 | Training stream input represented inside the combined table |
| `analytics.uk_dap_citizens_baseline_updated` | 104,456 | Citizen onboarding stream input represented inside the combined table |
| `analytics.kictanet_all_clusters_merged` | 13,122 | KICTANET stream input represented inside the combined table |
| `analytics.icta_training_data` | 103,267 | Older training table currently used by parts of the app/demo layer |
| `analytics.pathways_data_updated` | 106,045 | Separate registration-like source; should not be summed into training without mapping |

Observed source breakdown inside `analytics."20_million_by_2032"`:

| Source | Rows observed |
| --- | ---: |
| `Citizens` | 104,456 |
| `Training` | 104,207 |
| `KICTANET` | 13,122 |

Observed identifier coverage in `analytics."20_million_by_2032"`:

| Identifier | Distinct values observed |
| --- | ---: |
| `record_id` | 221,785 |
| `survey_uuid` | 104,457 |
| `national_id` | 102,374 |
| `phone_number` | 110,953 |
| `email` | 12,241 |

## Source table columns observed

The combined table includes fields required for most MVP reporting:

`source`, `record_id`, `full_name`, `gender`, `email`, `phone_number`, `national_id`, `age_group`, `county`, `sub_county`, `ward`, `village_town`, `region`, `region_group`, `disability_status`, `disability_type`, `assistive_device`, `education_level`, `primary_language`, `employment_status`, `income_activity`, `monthly_income`, `internet_frequency`, `device_used`, `self_rated_digital_skill`, `cdc_name`, `cdc_phone`, `institution`, `institution_level`, `trainer_level`, `course_taken`, `course_category`, `where_course_taken`, `date_trained`, `kictanet_cluster`, `cohort`, `has_device`, `device_type`, `internet_type`, `quiz_average`, `completion_date`, `pct_complete`, readiness question fields, `metric_1` through `metric_10`, GPS fields, and `survey_uuid`.

## Key implementation decisions

1. Use `analytics."20_million_by_2032"` as the only live participant source.
2. Create a stable view named `analytics.programme_participants` over the quoted table, or centralize the quoted table name in application SQL helpers. A view is preferred because the table starts with a digit and must otherwise be quoted everywhere.
3. Keep `source` as a first-class dimension. The dashboard must distinguish `Training`, `Citizens`, and `KICTANET` instead of merging them into one training count.
4. Progress to the 20M target must be confirmed before final release: leadership may want all programme participants, while the original dashboard used trained learners. Until confirmed, label the metric clearly.
5. Remove modeled/sample values from stakeholder-facing reporting. Where the combined table does not support a metric, show the metric as unavailable or partially covered with a coverage note.
6. Keep field-level coverage visible. A single actual table does not mean every KPI has complete data.

## Migration steps

### 1. Verify the live table

Before changing code or production config, the implementer should log into the live DB and confirm:

- `analytics."20_million_by_2032"` exists in `icta_dashboard`.
- Row count by `source`.
- Column list and data types.
- Whether row refreshes are append-only, truncate-and-load, or table swap.
- Whether refresh happens inside a transaction or can temporarily leave the table empty.

Recommended checks:

```sql
select source, count(*) from analytics."20_million_by_2032" group by source order by source;

select column_name, data_type
from information_schema.columns
where table_schema = 'analytics'
  and table_name = '20_million_by_2032'
order by ordinal_position;
```

### 2. Add a stable source view

Create a stable view to avoid quoting the numeric table name across app code:

```sql
create or replace view analytics.programme_participants as
select *
from analytics."20_million_by_2032";
```

If the data team refreshes the table by dropping and recreating it, confirm whether the view survives. If not, the refresh process should recreate the view after load, or the app should use the quoted table name directly through one shared SQL constant.

### 3. Add indexes for dashboard filters

The dashboard filters need fast access by source, geography, course, and date. If the table is owned by the data team, agree who owns indexes before adding them.

Recommended indexes:

```sql
create index if not exists idx_20m_source on analytics."20_million_by_2032" (source);
create index if not exists idx_20m_county on analytics."20_million_by_2032" (county);
create index if not exists idx_20m_sub_county on analytics."20_million_by_2032" (sub_county);
create index if not exists idx_20m_course_category on analytics."20_million_by_2032" (course_category);
create index if not exists idx_20m_date_trained on analytics."20_million_by_2032" (date_trained);
create index if not exists idx_20m_record_id on analytics."20_million_by_2032" (record_id);
```

### 4. Update the API data layer

Replace old table/staging reads with `analytics.programme_participants`:

| Area | Current issue | New source logic |
| --- | --- | --- |
| Executive overview | Mixes actual training, partial demographic staging, and registry/sample state | Query combined table, grouped by `source`; show coverage for incomplete fields |
| Geography | Training counts and county reference joins are tied to old training table | Use `county`, `sub_county`, `ward`, GPS fields from combined table; retain county normalization |
| Courses | Old course activity comes from training and registration-like sources | Use `source = 'Training'` plus `course_taken`, `course_category`, `date_trained`, `quiz_average`, `completion_date`, `pct_complete` |
| Demographics | Uses partial staging pool | Use combined table columns: `gender`, `age_group`, `disability_status`, `education_level`, `employment_status`, `device_used`, `has_device`, `internet_frequency` |
| Pipeline | Completion is sparse and partly modeled | Use actual `pct_complete`, `completion_date`, `quiz_average`; show unavailable when fields are not populated enough |
| Data quality | Registry still describes actual/sample/none lanes | Compute completeness, duplicates, and invalid values directly from the combined table |

### 5. Update global filters

Keep existing filters where possible, but make every filter resolve against the combined table:

- Time period: `date_trained` where present.
- Geography: `county`, `sub_county`, `ward`.
- Course category: `course_category`.
- Course: `course_taken`, if exposed later.
- Source: consider adding a new filter for `All`, `Training`, `Citizens`, `KICTANET`.

Filtering behavior should be consistent across every widget. If a widget cannot respond to a selected filter because the required field is missing, it should say why.

### 6. Replace provenance wording

The current provenance model was designed for actual/sample/none demo lanes. After migration:

- Remove sample/model badges from stakeholder-facing metrics.
- Show actual source table status.
- Add field coverage badges where needed, for example: `Gender known for 82% of rows`.
- Keep a clear “last refreshed” or “last checked” timestamp if the table has one. If no refresh timestamp exists in the table, report the dashboard query time and request a `loaded_at` or `refresh_batch_id` column from the data team.

### 7. Remove or quarantine old refresh paths

Stop relying on these for live stakeholder reporting:

- `scripts/live-refresh.sh`
- Old staging transformations under `db/live`
- Sample generation for missing dashboard lanes
- Demo-only registry assumptions

Do not delete them immediately if they are useful for rollback. Mark them as legacy/demo-only in docs and code comments.

### 8. Update production database target

Production currently must point to the live database if row changes are expected to auto-pick up:

- Desired DB: `icta_dashboard`
- Not desired for live reporting: `icta_dashboard_demo`

Before switching, ensure required support objects exist in the live DB, especially county reference data and any app schema objects still needed by the UI. If the rewritten API no longer needs old registry tables, remove that dependency first.

### 9. Test before publishing

Minimum verification:

- Build passes.
- Lint passes.
- API smoke test passes for all dashboard routes.
- County filter changes all applicable widgets.
- Course/category filter changes all applicable widgets.
- Source breakdown totals match direct SQL from `analytics."20_million_by_2032"`.
- No stakeholder-facing widget displays sample/model data.
- Completion metrics are labeled honestly if completion fields are sparse.
- Header and footer branding reflect the approved wording.

### 10. Deploy and monitor

Deployment sequence:

1. Commit the migration.
2. Push to GitHub.
3. Pull on the server.
4. Rebuild and restart the app container.
5. Confirm `DATABASE_URL` points to `icta_dashboard`.
6. Smoke test the public URL.
7. Compare public API totals to direct DB totals.

Rollback:

- Keep the previous image/commit available.
- Keep `icta_dashboard_demo` until the live migration has been accepted.
- If live table refresh causes errors, roll back the app to the previous commit or temporarily point back to the demo DB.

## Auto-refresh expectations

The dashboard will automatically pick up data added to or removed from `analytics."20_million_by_2032"` if:

- The app queries that table or its stable view directly.
- The table name remains `analytics."20_million_by_2032"`.
- Required columns remain compatible.
- The production app points to the live `icta_dashboard` database.
- No cached static build output is used for API results.

A redeploy is required if:

- Columns are renamed, removed, or change type incompatibly.
- The table moves schema or changes name.
- New KPI logic or mappings are required.
- The app still points to `icta_dashboard_demo`.

## Remaining open questions

1. Should the headline 20M progress count all rows in the combined table, all unique people across all sources, or only `source = 'Training'`?
2. What is the official deduplication key for cross-stream reporting: `national_id`, phone, email, `survey_uuid`, or a generated person key?
3. Should `Citizens` and `KICTANET` be shown as onboarding/reach rather than trained learners?
4. What refresh timestamp should the dashboard display?
5. Who owns index creation and refresh process reliability on the combined table?
