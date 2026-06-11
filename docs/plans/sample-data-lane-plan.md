# Sample Data Lane — Plan for Team Discussion

**Status:** Draft for team review — not yet approved
**Author:** Alfred / dashboard team
**Date:** 2026-06-10
**Relates to:** `docs/requirements/mark-data-grounded-requirements.md` (Mark's data-grounded spec), `docs/requirements/national-skilling-executive-dashboard.md` (Steph's original spec)

---

## 1. The problem this solves

Mark's requirements doc describes seven source datasets. The live DB currently holds **one flattened table** (`analytics.icta_training_data`, 103,267 rows, 12 columns). That table supports roughly 2 of the 6 MVP pages with real data. The remaining pages — Demographics & Inclusion, Training Pipeline, Digital Readiness, parts of Geography — depend on data that exists in Mark's files but is not loaded.

The team's direction: **build the full dashboard now, fill data gaps with believable sample data, flag it internally, and let the data team replace it progressively.** This document defines how we do that without ever putting a fabricated number in front of leadership as if it were real.

## 2. Core principles (non-negotiable)

1. **The headline national count is always real.** "Unique learners" on the Executive Overview and the progress-to-20M card use only actual loaded data (currently 101,430 after dedup). Sample data fills *breakdowns and secondary views*, never the national total.
2. **Provenance is data, not discipline.** Every row, every API response, and every widget carries a machine-readable source flag. No developer "remembers to add a badge" — the badge renders itself from the payload.
3. **Sample data is enrichment-first, invention-last.** Wherever possible we attach modeled *attributes* to **real learner records** (e.g., a modeled gender split over the real 101k learners) rather than inventing learners. Entirely synthetic entities (cohorts, CDCs) are created only where no real structure exists at all.
4. **Sample data is researched, not random.** Distributions are anchored to published Kenyan statistics (KNBS 2019 Census, Communications Authority sector reports) so the demo numbers are plausible at county level and survive expert eyeballing.
5. **Sample data drains away automatically.** Each modeled dataset lives where its real counterpart will land. When Mark loads a real dataset, we switch one source flag and the page flips from "modeled" to "actual" with no UI or query rework.

## 3. Data architecture — three lanes

| Lane | Schema | Contents |
|---|---|---|
| **Actual** | `raw` → `staging` → `analytics` | Mark's loaded data. Today: `analytics.icta_training_data`. |
| **Sample** | `sample` | Modeled tables mirroring the structure of the seven expected datasets, plus synthetic delivery structures (cohorts/CDCs). Every table has `data_source = 'sample'` baked in. |
| **Reference** | `ref` | Always-real lookup data: KNBS county/sub-county/ward master list, county codes, GeoJSON boundaries, population figures, course category lookups. Never synthetic. |

The `staging` views that feed the API read **actual first, sample as fallback**, resolved per dataset (not per query), via a single `app.dataset_registry` table:

```sql
CREATE TABLE app.dataset_registry (
  dataset_key    text PRIMARY KEY,   -- 'registration', 'baseline', 'completion', ...
  expected_table text NOT NULL,      -- raw.learner_baseline etc.
  active_source  text NOT NULL CHECK (active_source IN ('actual','sample','none')),
  loaded_at      timestamptz,
  row_count      integer,
  notes          text
);
```

Flipping `active_source` from `'sample'` to `'actual'` is the entire cutover for a dataset. The registry also powers the Data Quality page's "what's real" table and the per-widget provenance flags.

## 4. Provenance model — DB to widget

**API contract.** Every dashboard endpoint returns, alongside its data:

```json
{
  "data": { ... },
  "provenance": {
    "status": "actual" | "modeled" | "blended",
    "datasets": [
      { "key": "training_records", "source": "actual", "as_of": "2026-04-30" },
      { "key": "baseline", "source": "sample", "as_of": null }
    ],
    "note": "Demographic splits are modeled estimates pending Dataset 2 load."
  }
}
```

- `actual` — every input dataset is real.
- `modeled` — the widget's primary measure comes from sample data.
- `blended` — real totals, modeled breakdown (the most common case: e.g., real county learner counts split by modeled gender).

**The subtle tell (widget level).** Each widget (KPI card, chart, table) renders a provenance mark from its payload:

- A **small dot (6px) immediately right of the widget title**:
  - solid slate dot `●` — actual data;
  - **amber dot `●`** — modeled (sample);
  - **half-filled / ringed amber `◐`** — blended.
- Hovering the dot shows a tooltip: *"Modeled estimate — pending learner baseline dataset (Dataset 2). Totals are actual."* with the underlying dataset list and as-of dates.
- The dot is quiet enough that an executive scanning the page is not distracted, but anyone on the team can audit a screen at a glance.

**Supporting tells (page and export level):**

- A one-line **page footer**: "Data through 30 Apr 2026 · ● actual · ● modeled estimate — see Data Quality" (legend doubles as the explanation).
- **Provenance mode**: a keyboard/footer toggle that overlays every widget with its full source detail — for internal review sessions, off by default.
- **Exports** (PDF/CSV) automatically append the provenance legend and per-widget source list as footnotes, so a screenshot or printout can't silently shed the flags.
- The **Data Quality page** carries the authoritative registry: each of the seven datasets, its load status, row counts, and which pages it powers. This page is the standing internal flag and the standing request to the data team.

> **Team decision needed:** is the amber-dot treatment the right visibility level for CS/PS-facing demos, or do we want the modeled marks more explicit (e.g., "modeled" text label) until first real-data cutover? See §9.

## 5. Sample data generation — methodology per gap

All generation is scripted (`db/sample/`), seeded (deterministic — same output every run), and reviewed before load. Each generator documents its anchor sources inline.

### 5.1 Demographics & inclusion (gap: Dataset 2 / 7)

Method: **attribute enrichment on real learners.** For each of the 101,430 real unique learners, assign gender, age band, disability status, education level, and employment status by sampling county-conditioned distributions.

Implementation status: v1 conditions on the learner's former province (the 8 region groups), shifting national base rates for gender, education, and device/internet access per KNBS and CA patterns. Full per-county conditioning can follow M&E sign-off on the anchors.

Anchors:
- Gender and age structure: KNBS 2019 Census county tables (Volume III), adjusted toward a training-program age profile (concentration in 18–35).
- Disability: KNBS 2019 Washington Group short-set results (~2.2% national, varies by county); disability *type* split from the same source.
- Education attainment by county: KNBS 2019 Census Volume IV.
- Employment status: KNBS labour force reports, youth-weighted.

Result: county totals remain exactly real; only the splits are modeled → all demographic widgets are **blended**, never fully synthetic.

### 5.2 Sub-county / ward geography (gap: Dataset 2 granularity)

Method: real county learner counts are **allocated down** to real sub-counties and wards (from `ref` master list) proportional to KNBS population shares, with mild noise so it doesn't look mechanically uniform.

Anchors: official KNBS/IEBC sub-county and ward lists and population; real GeoJSON boundaries.

Result: drilldown maps work end-to-end; county level **actual**, sub-county/ward levels **modeled** (each map level carries its own provenance flag).

Open item: the existing table's `region` field (283 values, 8 groups) may already *be* sub-county — if Mark confirms, this whole section may shrink to a mapping exercise. Ask before building.

### 5.3 Completion, quiz, pipeline (gap: Dataset 3)

Method: attribute enrichment on real **enrolment records** (103,267 rows). Assign each a journey state (not started / in progress / completed / certified-ready) and, for completed records, a quiz average.

Anchors: published completion benchmarks for facilitated virtual skilling programs (we will document the chosen rate band and rationale in the generator; facilitated cohort programs typically land far above open-MOOC rates). Completion varies plausibly by course category and county. Quiz scores drawn from a realistic distribution around the pass threshold.

Result: funnel, completion-rate, drop-off, and course-performance widgets all render; all **blended** (real enrolment denominators, modeled numerators). Completion-dependent KPIs (completion rate, certification rate) are clearly modeled until Dataset 3 loads.

### 5.4 Digital readiness indices (gap: Dataset 2 survey blocks)

Method: per-learner index scores (device skills, communication, commerce, gov services, cybersecurity, e-waste, composite) sampled from distributions conditioned on the learner's modeled education/age/county and county connectivity context.

Anchors: Communications Authority of Kenya sector statistics for device and internet access by region; plausible spread for self-rated skills.

Result: Page 6 renders fully; flagged **modeled** throughout — this is the most synthetic page and the tooltip says so explicitly.

### 5.5 Cohorts, clusters, CDCs, institutions (gap: Datasets 5/6 + structure)

Method: **synthetic entities** — the one place we invent records rather than enrich. A plausible delivery structure (cohorts per county sized to real learner volumes, clusters, named-by-pattern CDCs like "Busia CDC 01") with learners assigned to them.

Result: Page 8 (institutional/cohort performance) renders; flagged **modeled**, entity names obviously systematic so nobody mistakes "Busia CDC 01" for a real facility.

### 5.6 What we do NOT generate

- No synthetic learners added to any national or county total.
- No partner, funding, or infrastructure data (out of scope per Mark's doc; Steph's partner/infra views are Phase 2).
- No impact free-text (Page 9 deferred until Dataset 2 loads — word-cloud-from-fake-quotes crosses the credibility line).
- No fabricated trend history before 2026-03-31. The trend chart shows the real two-month window; the 2032 trajectory line is a *target* line (labeled as such), not fake history.

## 6. Page-by-page provenance map (MVP)

| Page | Widgets | Provenance at launch |
|---|---|---|
| 1. Executive Overview | Unique learners, enrolments, progress-to-20M, counties reached, trend | **Actual** |
| | Completion rate, gender split, inclusion summary | **Blended/Modeled** (amber) |
| | Data quality score | **Actual** (computed from real table: 919 dup IDs, placeholder fields) |
| 2. Geographic Coverage | County map, county leaderboard, top/bottom 10 | **Actual** |
| | Sub-county/ward drilldown, completion heatmap | **Modeled** |
| 3. Demographics & Inclusion | All splits and inclusion KPIs | **Blended** (real totals, modeled splits) |
| 4. Training Pipeline | Funnel, drop-off, cohort progress | **Blended/Modeled** |
| 5. Course Performance | Enrolments by course, popularity, category mix | **Actual** |
| | Completion/quiz by course, performance matrix | **Blended** |
| 6. Data Quality | Registry, duplicates, completeness, refresh log | **Actual** — and the page that documents everything above |

Net effect: the dashboard *feels complete* — every page renders, every drilldown works — while roughly half the widgets carry the quiet amber mark until real datasets land.

## 7. Cutover lifecycle (sample → real)

Per dataset, when Mark loads real data into `raw`:

1. Data team loads file → `raw.<dataset>` (landing tables already created, columns per Mark's doc).
2. We run the cleaning + learner-matching pipeline → `staging`.
3. Validation diff: real vs modeled headline numbers, reviewed before flip (big divergences are themselves findings worth reporting).
4. Flip `app.dataset_registry.active_source` → `'actual'`. Widgets' dots turn slate automatically; tooltips update.
5. Sample tables for that dataset are retired (kept in `sample` for audit, excluded from all views).

## 8. Build sequence

1. **Week 1:** `ref` geography (counties/sub-counties/wards + GeoJSON + population), `sample` schema + dataset registry, provenance contract in the API layer, widget dot component. Pages 1–2 with real data + first modeled overlays.
2. **Week 2:** Sample generators (§5.1–5.5) with documented anchors; Pages 3–5; Data Quality page (real metrics + registry).
3. **Week 3:** Provenance mode, exports with footnotes, polish, internal review with team — then exec-facing demo.

(Tracks 1 and 2 from earlier discussion are folded in: real-data pages are Week 1; landing tables and pipeline scaffolding land in Weeks 1–2.)

## 9. Decisions we need from the team

1. **Tell visibility:** quiet amber dot + tooltip (proposed) vs explicit "modeled" text labels — especially for any demo in front of CS/PS before first real cutover.
2. **Demo policy:** is the sample-backed build internal-only until Datasets 2 and 3 are loaded, or acceptable in exec demos with the dots visible? (Recommend: internal + controlled demos only, with provenance mode shown once at the start of any briefing.)
3. **`region` field:** Mark to confirm what the 283 regions / 8 region groups in the current table represent — may eliminate the sub-county modeling entirely.
4. **Duplicate IDs:** 919 duplicate `unique_id`s — known issue or unreliable key? Affects the headline number (101,430).
5. **Pass threshold + completion definition:** needed to label the modeled completion band honestly (Mark's doc §23, decisions 1–5).
6. **DB security:** port 15424 is open to the internet; Dataset 2 contains national IDs, phones, GPS. Firewall/allowlist **before** that load. Owner needed.
7. **Anchor sign-off:** M&E to sanity-check the KNBS/CA-based distributions before we generate.

---

*Once approved, this plan supersedes the earlier "sample data schema" sketch from the pre-kickoff session. The registry + provenance contract is the load-bearing piece; everything else is generators and dots.*
