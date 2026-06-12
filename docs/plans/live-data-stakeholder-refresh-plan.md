# Live Data Stakeholder Refresh Plan

**Status:** Revised implementation handoff plan
**Prepared for:** Becky / COO review and implementation approval
**Prepared by:** Alfred
**Timestamp:** 2026-06-12 22:36:51 EAT

This plan is based on the live database state observed at the timestamp above. Whoever implements this must log into the database and verify the current table list, row counts, field completeness, and join quality before making changes. Do not assume these counts remain current.

## 1. Context

The ICTA dashboard was originally made demo-ready using a separate demo database with actual training records and modeled placeholder data. New data has since been added to the live `icta_dashboard` database.

For the stakeholder meeting, the ask is to use actual live data. We should not present demo/modelled data as source-of-truth. However, the live data is not normalized, there is no confirmed shared learner key across the main tables, and several key fields are incomplete. The dashboard must therefore show live data with clear coverage labels: complete, partial, or unavailable.

## 2. Current Database Position

There are two relevant databases:

| Database | Purpose | Current position |
|---|---|---|
| `icta_dashboard` | Live database where the data team has added new actual data | Contains new `analytics.*` source tables |
| `icta_dashboard_demo` | Current production dashboard database | Contains copied training records plus registry/reference/sample tables |

Current production has been using `icta_dashboard_demo`. A direct switch to `icta_dashboard` is not safe unless the dashboard support structures are created there and all API expectations are verified.

## 3. Live Data Available As Of Audit

| Data area | Live source table | Current coverage | Status |
|---|---|---:|---|
| Training records / official national count | `analytics.icta_training_data` | 103,267 records / about 101,430 unique learners | Strong actual source |
| Registration / intake / course interest | `analytics.pathways_data_updated` | 106,045 rows | Actual, but not safely joinable by ID and has missing/dirty fields |
| Completion / quiz | `analytics.cluster_1` | 69 rows | Actual but too small for national KPI |
| Contacts / sub-county | `analytics.cluster_2` | 500 rows | Partial actual |
| Busia / cohort / device | `analytics.cluster_3` | 506 rows | Partial actual |
| Contact / demographics | `analytics.cluster_4` | 1,093 rows | Partial actual; complete gender/contact fields |
| County / cohort / cluster | `analytics.cluster_5` | 2,747 rows | Partial actual |
| Contact / demographics | `analytics.cluster_6` | 4,038 rows | Partial actual; complete gender/contact fields |
| Age / national ID / contact | `analytics.cluster_7` | 1,028 rows | Partial actual; complete gender/contact fields plus age group and national ID |
| Disability / PWD | `analytics.cluster_8`, `analytics.cluster_9` | 1,253 + 1,202 rows | Partial actual |
| Age / sub-county supplement | `analytics.cluster_10` | 670 rows | Partial actual |
| Baseline / digital readiness | `analytics.uk_dap_citizens_baseline` | 0 rows | Not available |

## 4. Critical Join Constraint

There is currently no confirmed shared learner key between the main live sources.

Verified issue:

- `pathways_data_updated.participant_id` does **not** match `icta_training_data.unique_id`.
- The observed match count between those fields is `0`.
- `participant_id` appears to be a row sequence, not a learner identifier.
- `icta_training_data.unique_id` uses a different format, for example `SD047210`-style values.

The only practical matching available today is fuzzy or name-based matching. That may be useful for exploratory coverage checks, but it is not reliable enough to silently enrich the official 101k learner base.

Implementation rule:

> Do not join `pathways_data_updated` to `icta_training_data` using `participant_id`. Do not treat name matches as confirmed learner identity unless the output is confidence-labelled.

Required question for data team:

> Can a real shared learner key be exported across registration, training, completion, cohort, and supplement datasets?

If not, matching must be done with explicit confidence levels, such as exact email match, exact phone match, exact normalized name match, and manual-review/low-confidence matches.

## 5. Known Data Deficiencies

The live data is not normalized. Similar fields appear with different names in different tables.

| Concept | Variants observed |
|---|---|
| Email | `email`, `email_address` |
| Phone | `phone`, `phone_number`, `mobile_phone_number` |
| Sub-county | `sub_county`, `subcounty` |
| Learner identifier | `unique_id`, `participant_id`, `national_id`, email/phone fallback |
| Name | `participant_name`, `full_name`, `name`, `first_name`, `last_name` |

Important missing or incomplete areas:

| Area | Deficiency |
|---|---|
| Gender | Strong in some cluster tables, but mostly missing in `pathways_data_updated` |
| PWD / disability | Available only in partial supplement tables |
| Completion | Only 69 actual completion records |
| Certification | No complete national certification source |
| Baseline / readiness | Baseline table exists but has 0 rows |
| Device / internet access | Available only in partial cohort/device tables |
| Ward / village / GPS | Not available because baseline has 0 rows |
| Employment / income / impact | Not available because baseline has 0 rows |
| Course names | `pathways_data_updated` contains all 31 training course labels plus extra labels that require mapping |
| Dirty rows | `pathways_data_updated` includes header-like rows loaded as data |

## 6. Registration And Course Data Rule

`pathways_data_updated` should not be merged or summed with `icta_training_data`.

Why:

- `pathways_data_updated` has 106,045 rows.
- `icta_training_data` has 103,267 training records.
- There is no shared stable learner key between them.
- `pathways_data_updated` contains course labels that do not exactly belong to the 31-course training table, including extra labels and header-like values.

Implementation rule:

> Present `pathways_data_updated` as registrations received / intake / course interest, not as additional trained learners.

The official learner and training totals should remain based on `icta_training_data` unless ICTA/data team confirms a different official source.

## 7. Data Cleaning Rules Required Before Use

Any reporting layer over the live data must apply basic cleaning rules before exposing results.

Minimum cleaning rules:

- remove header rows loaded as data, for example rows where name/course/gender are literal headers;
- trim leading/trailing spaces;
- normalize repeated spaces;
- normalize casing for names, emails, counties, courses, and gender;
- standardize `email` / `email_address`;
- standardize `phone` / `phone_number`;
- standardize `sub_county` / `subcounty`;
- standardize course names before comparing sources;
- keep original raw values for audit.

The data team should be told that header rows were loaded into `pathways_data_updated`.

## 8. Implementation Goal

Use actual live data for the stakeholder meeting, while making source limitations visible.

The implementation should:

- use live actual data where it is strong;
- use partial actual data where it exists;
- clearly label partial coverage;
- hide or clearly label unsupported metrics;
- avoid presenting demo/modelled values as source-of-truth;
- avoid reporting incomplete fields as full national KPIs;
- avoid merging registration and training counts unless a verified source mapping exists.

## 9. Provenance And Coverage Model Needed

The current dashboard provenance model supports `actual`, `sample`, and `none` at registry level, and `actual`, `blended`, and `modeled` at widget level.

For this stakeholder refresh, that is not enough. We need a way to show real-but-incomplete data.

Recommended states:

| State | Meaning |
|---|---|
| `actual` | Real source data with adequate coverage for the displayed metric |
| `partial` | Real source data, but limited coverage or incomplete fields |
| `unavailable` | Required source data is not loaded or has 0 usable rows |
| `modeled` | Generated/sample estimate; should be hidden or avoided for this stakeholder view |

Recommended registry additions:

- `coverage_count`
- `coverage_denominator`
- `coverage_pct`
- `coverage_note`

Example:

> Gender known for 8,xxx matched/available records out of 101,430 learners.

Exact coverage must be recalculated by the implementer after choosing the matching and deduplication rules.

## 10. What Can Be Used Safely

| Dashboard area | Live data usable? | Guidance |
|---|---|---|
| National learner count | Yes | Use `icta_training_data` unique learner count |
| Training records | Yes | Use `icta_training_data` row count |
| County reach | Yes | Use `icta_training_data.county` |
| Courses trained | Yes | Use `icta_training_data.course_taken` |
| Registration volume | Yes, separate measure | Use `pathways_data_updated`, but do not add it to trained learners |
| Course interest / intake demand | Partial | Use `pathways_data_updated` after course-name cleaning and mapping |
| Gender | Partial | Include `cluster_4`, `cluster_6`, `cluster_7`, plus other cluster tables where valid; label coverage |
| Age group | Partial | Use `cluster_7`, `cluster_8`, `cluster_9`, `cluster_10`, and other cluster tables where valid; label coverage |
| PWD / disability | Partial | Use `cluster_8` and `cluster_9`; label coverage |
| Cohorts / clusters | Partial | Use `cluster_3` and `cluster_5`; label coverage |
| Sub-county | Partial | Use `cluster_2`, `cluster_3`, `cluster_5`, `cluster_8`, `cluster_9`, `cluster_10`; label coverage |
| Device / internet | Partial | Use `cluster_3`; not national |

## 11. What Should Not Be Presented As Full National KPI

Do not present the following as complete national measures unless new verified data has been loaded:

- completion rate;
- certification rate;
- digital readiness;
- AI readiness;
- national device access;
- national internet access;
- ward/village/GPS coverage;
- employment status;
- income;
- post-training impact.

These are either missing, too small, or only partially represented in the current live data.

For this audience, the executive completion-rate card should not show the previously modeled rate. It should say:

> Not yet measured nationally in current source data.

If the 69 completion records are shown, they should be labelled as:

> 69 actual completion records loaded; not representative of national completion.

## 12. Recommended Implementation Steps

### Step 1: Verify The Current DB

The implementer should log in and confirm:

- current production `DATABASE_URL`;
- current live DB table list;
- row counts for all `analytics.*` tables;
- whether `uk_dap_citizens_baseline` still has 0 rows;
- whether `pathways_data_updated.participant_id` still has 0 matches to `icta_training_data.unique_id`;
- whether any new shared learner key has been added;
- whether any new tables have been added since this plan timestamp.

### Step 2: Prepare The Live DB For The Dashboard

The existing architecture can support this, but the live DB needs the dashboard support layer.

Recommended path:

1. Run the idempotent dashboard DB apply script against the live DB to create required registry/reference structures.
2. Confirm `app.dataset_registry`, `ref.counties`, and supporting objects exist.
3. Do not overwrite source tables.
4. Confirm the app can connect to the live DB in a test environment before pointing production at it.

### Step 3: Create A Minimal Live Reporting Layer

Create mapped reporting views or tables from the live `analytics.*` tables.

Minimum mappings needed:

- source table;
- raw row id or source row number;
- learner identifier, where available;
- matching confidence;
- learner name;
- email;
- phone;
- gender;
- county;
- sub-county;
- disability status;
- course;
- cohort;
- cluster;
- completion fields.

Important:

> The reporting layer must carry `source_table` and `match_confidence`. Do not hide uncertain joins.

### Step 4: Replace Demo/Modelled Values Selectively

Replace demo/modelled data only where actual live data is strong enough:

- national count;
- county reach;
- trained course distribution;
- separate registration/intake volume;
- partial gender/PWD/cohort/sub-county views with coverage labels.

Keep unsupported fields hidden or labelled unavailable.

### Step 5: Update Dashboard Copy And Labels

Use stakeholder-safe wording:

- "Actual live data"
- "Partial actual coverage"
- "Field incomplete in source data"
- "Not available in current source"
- "Not yet measured nationally"

Avoid showing demo/modelled data as if it is live actual data.

### Step 6: Validate Before Meeting

Run checks before presenting:

- national learner count renders from `icta_training_data`;
- registration is shown separately from trained learners;
- county view renders from `icta_training_data`;
- course charts render and do not double-count registration plus training;
- unsupported metrics are hidden or labelled;
- completion is not shown as a national rate from 69 rows;
- partial fields show coverage notes;
- no chart silently uses demo/modelled data as source-of-truth;
- API routes pass smoke tests;
- production URL loads cleanly.

## 13. Recommended Meeting Framing

The dashboard should be framed as:

> "This is the current live data view. The strong areas are national reach, county reach, and training-course participation. Registration, gender, age, PWD, cohort, and device views are shown only where source coverage exists. Completion, certification, digital readiness, employment, income, GPS, and impact are not yet nationally measured in the current source data."

## 14. Go / No-Go

### Go For Stakeholder Meeting If

- national progress uses actual live training data;
- county reach uses actual live training data;
- trained course distribution uses actual live training data;
- registration/intake is separate from trained learners;
- partial fields are clearly labelled;
- demo/modelled data is hidden or not presented as source-of-truth;
- completion is not presented as a national rate.

### No-Go For Full Source-Of-Truth Dashboard If

- completion remains only 69 rows;
- baseline remains 0 rows;
- PWD/gender/county fields remain fragmented;
- no shared learner key exists;
- no matching/coverage layer exists;
- incomplete fields are presented as complete national KPIs.

