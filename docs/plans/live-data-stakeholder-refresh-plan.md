# Live Data Stakeholder Refresh Plan

**Status:** Implementation handoff plan
**Prepared for:** Becky / COO review and implementation approval
**Prepared by:** Alfred
**Timestamp:** 2026-06-12 22:25:59 EAT

This plan is based on the live database state observed at the timestamp above. Whoever implements this must log into the database and verify the current table list, row counts, and field completeness before making changes. Do not assume these counts remain current.

## 1. Context

The ICTA dashboard was originally made demo-ready using a separate demo database with a mix of actual training records and modeled placeholder data. New data has since been added to the live `icta_dashboard` database.

For the stakeholder meeting, the ask is to use actual live data. We should not present demo/modelled data as source-of-truth. However, the live data is not normalized and some fields are incomplete, so the dashboard must clearly show where the data is complete, partial, or unavailable.

## 2. Current Database Position

There are two relevant databases:

| Database | Purpose | Current position |
|---|---|---|
| `icta_dashboard` | Live database where the data team has added new actual data | Contains new `analytics.*` source tables |
| `icta_dashboard_demo` | Current production dashboard database | Contains copied training records plus registry/reference/sample tables |

Current production has been using `icta_dashboard_demo`. A direct switch to `icta_dashboard` is not safe without checking support tables and API expectations.

## 3. Live Data Available As Of Audit

| Data area | Live source table | Current coverage | Status |
|---|---|---:|---|
| Training records / national count | `analytics.icta_training_data` | 103,267 records / about 101,430 unique learners | Strong actual source |
| Registration / course demand | `analytics.pathways_data_updated` | 106,045 rows | Actual, but incomplete gender/email |
| Completion / quiz | `analytics.cluster_1` | 69 rows | Actual but too small for national KPI |
| Contacts / sub-county | `analytics.cluster_2` | 500 rows | Partial actual |
| Busia / cohort / device | `analytics.cluster_3` | 506 rows | Partial actual |
| County / cohort / cluster | `analytics.cluster_5` | 2,747 rows | Partial actual |
| Disability / PWD | `analytics.cluster_8`, `analytics.cluster_9` | 1,253 + 1,202 rows | Partial actual |
| Age / sub-county supplement | `analytics.cluster_10` | 670 rows | Partial actual |
| Baseline / digital readiness | `analytics.uk_dap_citizens_baseline` | 0 rows | Not available |

## 4. Known Data Deficiencies

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
| Gender | Missing in most `pathways_data_updated` rows |
| PWD / disability | Available only in partial supplement tables |
| Completion | Only 69 actual completion records |
| Certification | No complete national certification source |
| Baseline / readiness | Baseline table exists but has 0 rows |
| Device / internet access | Available only in partial cohort/device tables |
| Ward / village / GPS | Not available because baseline has 0 rows |
| Employment / income / impact | Not available because baseline has 0 rows |

## 5. Implementation Goal

Use actual live data for the stakeholder meeting, while making source limitations visible.

The implementation should:

- use live actual data where it is strong;
- use partial actual data where it exists;
- hide or clearly label unsupported metrics;
- avoid presenting demo/modelled values as source-of-truth;
- avoid reporting incomplete fields as full national KPIs.

## 6. What Can Be Used Safely

| Dashboard area | Live data usable? | Guidance |
|---|---|---|
| National learner count | Yes | Use `icta_training_data` unique learner count |
| Training records | Yes | Use `icta_training_data` row count |
| County reach | Yes | Use `icta_training_data.county` |
| Course demand / course taken | Yes | Use `icta_training_data.course_taken` and/or `pathways_data_updated.course_taken` |
| Registration volume | Yes, with caveat | Use `pathways_data_updated`, but flag missing gender/email |
| Gender | Partial | Use only where present; label coverage |
| Age group | Partial | Use cluster tables only; label coverage |
| PWD / disability | Partial | Use `cluster_8` and `cluster_9`; label coverage |
| Cohorts / clusters | Partial | Use `cluster_3` and `cluster_5`; label coverage |
| Sub-county | Partial | Use cluster tables; label coverage |
| Device / internet | Partial | Use `cluster_3`; not national |

## 7. What Should Not Be Presented As Full National KPI

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

## 8. Recommended Implementation Steps

### Step 1: Verify The Current DB

The implementer should log in and confirm:

- current production `DATABASE_URL`;
- current live DB table list;
- row counts for all `analytics.*` tables;
- whether `uk_dap_citizens_baseline` still has 0 rows;
- whether any new tables have been added since this plan timestamp.

### Step 2: Avoid A Blind DB Switch

Do not simply point the application from `icta_dashboard_demo` to `icta_dashboard` without checking application dependencies.

The dashboard currently expects support structures such as:

- `app.dataset_registry`;
- reference county tables;
- sample/mapped tables used by some API routes.

A direct switch could break routes or silently remove required dashboard metadata.

### Step 3: Create A Minimal Live Reporting Layer

Create a mapped reporting layer from the live `analytics.*` tables. This can be views or tables, depending on the implementation path.

Minimum mappings needed:

- learner identifier;
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

### Step 4: Replace Demo/Modelled Values Selectively

Replace demo/modelled data only where actual live data is strong enough:

- national count;
- county reach;
- course demand;
- registration volume;
- partial gender/PWD/cohort/sub-county views.

Keep unsupported fields hidden or labelled unavailable.

### Step 5: Update Dashboard Copy And Labels

Use stakeholder-safe wording:

- "Actual live data"
- "Partial coverage"
- "Field incomplete in source data"
- "Not available in current source"

Avoid showing demo/modelled data as if it is live actual data.

### Step 6: Validate Before Meeting

Run checks before presenting:

- national learner count renders;
- county view renders;
- course charts render;
- unsupported metrics are hidden or labelled;
- no chart silently uses demo/modelled data as source-of-truth;
- API routes pass smoke tests;
- production URL loads cleanly.

## 9. Recommended Meeting Framing

The dashboard should be framed as:

> "This is the current live data view. The strong areas are national reach, county reach, and course participation. Some fields are incomplete in the source data, especially completion, PWD coverage, device/internet access, readiness, employment, income, and impact. Those areas are shown only where actual data exists or marked as unavailable."

## 10. Go / No-Go

### Go For Stakeholder Meeting If

- national progress uses actual live data;
- county reach uses actual live data;
- course demand uses actual live data;
- partial fields are clearly labelled;
- demo/modelled data is hidden or not presented as source-of-truth.

### No-Go For Full Source-Of-Truth Dashboard If

- completion remains only 69 rows;
- baseline remains 0 rows;
- PWD/gender/county fields remain fragmented;
- no reporting/matching layer exists;
- incomplete fields are presented as complete national KPIs.

