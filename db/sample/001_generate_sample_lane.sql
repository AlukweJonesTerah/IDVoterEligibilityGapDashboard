-- Sample lane generators. See docs/plans/sample-data-lane-plan.md §5.
--
-- Method: enrichment-first. Modeled attributes are attached to REAL learner
-- and enrolment records from analytics.icta_training_data. No synthetic
-- learners are created; totals everywhere remain actual.
--
-- Determinism: attributes derive from hashtext(salt || key), not random(),
-- so regeneration is idempotent and order-independent.
--
-- Distribution anchors (documented per plan §5; M&E to sign off):
--   * Gender, age structure: KNBS 2019 Census Vol III, youth-weighted for a
--     virtual skilling program.
--   * Disability: KNBS 2019 Washington Group short set (~2.2% national).
--   * Education attainment: KNBS 2019 Census Vol IV, urban-weighted.
--   * Completion band: facilitated virtual cohort programs (55-70%).
--   * Device/internet: Communications Authority sector statistics shape.

BEGIN;

CREATE OR REPLACE FUNCTION sample.hrand(salt text, key text)
RETURNS double precision LANGUAGE sql IMMUTABLE AS $$
  SELECT (hashtext(salt || ':' || key) & 2147483647)::double precision / 2147483647.0
$$;

-- ---------------------------------------------------------------------------
-- 1. Modeled learner attributes (stands in for Datasets 2 & 7)
--    County-conditioned: national base rates are shifted per former province
--    (the 8 region groups in the data), directionally per KNBS 2019 Census
--    education/attainment tables and CA sector statistics for access.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS sample.learner_attributes;
CREATE TABLE sample.learner_attributes AS
WITH learners AS (
  SELECT DISTINCT ON (t.unique_id) t.unique_id, t.county,
         coalesce(c.former_province, 'Other') AS province
  FROM analytics.icta_training_data t
  LEFT JOIN ref.counties c ON ref.norm_county(c.county_name) = ref.norm_county(t.county)
  ORDER BY t.unique_id, t.date_trained
),
adjusted AS (
  SELECT l.*,
    -- Female share of participants: lower in North Eastern and Coast,
    -- near parity in Nairobi/Central (KNBS 2019, directional).
    CASE l.province
      WHEN 'North Eastern' THEN -0.10
      WHEN 'Coast'         THEN -0.03
      WHEN 'Nairobi'       THEN  0.01
      WHEN 'Central'       THEN  0.01
      ELSE 0
    END AS female_adj,
    -- Education attainment shift: positive pushes the draw toward higher
    -- levels (Nairobi strongest), negative toward lower (North Eastern).
    CASE l.province
      WHEN 'Nairobi'       THEN  0.10
      WHEN 'Central'       THEN  0.04
      WHEN 'North Eastern' THEN -0.12
      WHEN 'Western'       THEN -0.03
      WHEN 'Nyanza'        THEN -0.02
      ELSE 0
    END AS edu_adj,
    -- Device and internet access shifts (CA sector statistics, directional).
    CASE l.province
      WHEN 'Nairobi'       THEN  0.10
      WHEN 'Central'       THEN  0.04
      WHEN 'North Eastern' THEN -0.18
      ELSE -0.03
    END AS device_adj,
    CASE l.province
      WHEN 'Nairobi'       THEN  0.12
      WHEN 'Central'       THEN  0.05
      WHEN 'North Eastern' THEN -0.20
      ELSE -0.04
    END AS net_adj
  FROM learners l
),
draws AS (
  SELECT a.*,
    sample.hrand('gender', a.unique_id) AS g_r,
    sample.hrand('age', a.unique_id) AS age_r,
    sample.hrand('pwd', a.unique_id) AS pwd_r,
    sample.hrand('pwdtype', a.unique_id) AS pwdtype_r,
    LEAST(0.9999, GREATEST(0, sample.hrand('edu', a.unique_id) + a.edu_adj)) AS edu_r,
    sample.hrand('emp', a.unique_id) AS emp_r
  FROM adjusted a
)
SELECT
  unique_id,
  county,
  CASE
    WHEN g_r < 0.480 + female_adj THEN 'FEMALE'
    WHEN g_r < 0.995 THEN 'MALE'
    ELSE 'PREFER NOT TO SAY'
  END AS gender,
  CASE
    WHEN age_r < 0.38 THEN '18-24'
    WHEN age_r < 0.72 THEN '25-34'
    WHEN age_r < 0.88 THEN '35-44'
    WHEN age_r < 0.96 THEN '45-54'
    ELSE '55+'
  END AS age_band,
  pwd_r < 0.022 AS has_disability,
  CASE
    WHEN pwd_r >= 0.022 THEN NULL
    WHEN pwdtype_r < 0.35 THEN 'PHYSICAL'
    WHEN pwdtype_r < 0.60 THEN 'VISUAL'
    WHEN pwdtype_r < 0.75 THEN 'HEARING'
    WHEN pwdtype_r < 0.85 THEN 'COGNITIVE'
    ELSE 'OTHER'
  END AS disability_type,
  CASE
    WHEN edu_r < 0.02 THEN 'NO FORMAL EDUCATION'
    WHEN edu_r < 0.14 THEN 'PRIMARY'
    WHEN edu_r < 0.52 THEN 'SECONDARY'
    WHEN edu_r < 0.74 THEN 'TVET / CERTIFICATE'
    WHEN edu_r < 0.88 THEN 'DIPLOMA'
    WHEN edu_r < 0.98 THEN 'UNDERGRADUATE'
    ELSE 'POSTGRADUATE'
  END AS education_level,
  CASE
    WHEN emp_r < 0.30 THEN 'STUDENT'
    WHEN emp_r < 0.62 THEN 'UNEMPLOYED'
    WHEN emp_r < 0.82 THEN 'EMPLOYED'
    ELSE 'SELF-EMPLOYED'
  END AS employment_status,
  sample.hrand('device', unique_id) < 0.78 + device_adj AS has_device_access,
  sample.hrand('net', unique_id) < 0.71 + net_adj AS has_regular_internet,
  'sample'::text AS data_source
FROM draws;

CREATE INDEX ON sample.learner_attributes (unique_id);
CREATE INDEX ON sample.learner_attributes (county);

-- ---------------------------------------------------------------------------
-- 2. Modeled enrolment outcomes (stands in for Dataset 3)
--    One row per real training record; journey state + quiz for completers.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS sample.enrolment_outcomes;
CREATE TABLE sample.enrolment_outcomes AS
WITH enrolments AS (
  SELECT row_number() OVER (ORDER BY unique_id, course_taken, date_trained) AS enrolment_seq,
         unique_id, course_taken, course_category, county, region, region_group, date_trained
  FROM analytics.icta_training_data
)
SELECT
  enrolment_seq,
  unique_id, course_taken, course_category, county, region, region_group, date_trained,
  CASE
    WHEN sample.hrand('status', enrolment_seq::text) < 0.62 THEN 'COMPLETED'
    WHEN sample.hrand('status', enrolment_seq::text) < 0.85 THEN 'IN PROGRESS'
    ELSE 'NOT STARTED'
  END AS status,
  CASE
    WHEN sample.hrand('status', enrolment_seq::text) < 0.62 THEN
      -- quiz ≈ normal(72, 12): mean of three uniforms scaled
      round( LEAST(100, GREATEST(20,
        72 + ( (sample.hrand('q1', enrolment_seq::text)
              + sample.hrand('q2', enrolment_seq::text)
              + sample.hrand('q3', enrolment_seq::text)) / 3.0 - 0.5 ) * 72
      ))::numeric, 1)
    ELSE NULL
  END AS quiz_average,
  CASE
    WHEN sample.hrand('status', enrolment_seq::text) < 0.62
    THEN date_trained + (2 + floor(sample.hrand('cdelay', enrolment_seq::text) * 12))::int
    ELSE NULL
  END AS completion_date,
  'sample'::text AS data_source
FROM enrolments;

ALTER TABLE sample.enrolment_outcomes
  ADD COLUMN certification_ready boolean;
UPDATE sample.enrolment_outcomes
   SET certification_ready = (status = 'COMPLETED' AND quiz_average >= 70);

CREATE INDEX ON sample.enrolment_outcomes (unique_id);
CREATE INDEX ON sample.enrolment_outcomes (county);
CREATE INDEX ON sample.enrolment_outcomes (course_taken);

-- ---------------------------------------------------------------------------
-- 3. Modeled digital readiness indices (stands in for Dataset 2 survey blocks)
--    Conditioned on modeled education + device/internet access.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS sample.readiness_indices;
CREATE TABLE sample.readiness_indices AS
WITH base AS (
  SELECT a.unique_id, a.county,
    40
    + CASE a.education_level
        WHEN 'NO FORMAL EDUCATION' THEN -14 WHEN 'PRIMARY' THEN -8
        WHEN 'SECONDARY' THEN 0 WHEN 'TVET / CERTIFICATE' THEN 6
        WHEN 'DIPLOMA' THEN 10 WHEN 'UNDERGRADUATE' THEN 15 ELSE 18 END
    + CASE WHEN a.has_device_access THEN 8 ELSE -8 END
    + CASE WHEN a.has_regular_internet THEN 8 ELSE -8 END AS centre
  FROM sample.learner_attributes a
)
SELECT
  unique_id, county,
  round(LEAST(100, GREATEST(5, centre + (sample.hrand('ridx1', unique_id) - 0.5) * 30))::numeric, 0) AS device_skills_index,
  round(LEAST(100, GREATEST(5, centre + 4 + (sample.hrand('ridx2', unique_id) - 0.5) * 30))::numeric, 0) AS communication_index,
  round(LEAST(100, GREATEST(5, centre - 6 + (sample.hrand('ridx3', unique_id) - 0.5) * 32))::numeric, 0) AS commerce_index,
  round(LEAST(100, GREATEST(5, centre - 4 + (sample.hrand('ridx4', unique_id) - 0.5) * 32))::numeric, 0) AS gov_services_index,
  round(LEAST(100, GREATEST(5, centre - 9 + (sample.hrand('ridx5', unique_id) - 0.5) * 30))::numeric, 0) AS cybersecurity_index,
  round(LEAST(100, GREATEST(5, centre - 12 + (sample.hrand('ridx6', unique_id) - 0.5) * 34))::numeric, 0) AS ewaste_index,
  'sample'::text AS data_source
FROM base;

ALTER TABLE sample.readiness_indices ADD COLUMN composite_score numeric;
UPDATE sample.readiness_indices
   SET composite_score = round((device_skills_index + communication_index + commerce_index
        + gov_services_index + cybersecurity_index + ewaste_index) / 6.0, 0);

CREATE INDEX ON sample.readiness_indices (unique_id);

-- ---------------------------------------------------------------------------
-- 4. Synthetic delivery structures (stands in for Datasets 5/6 structure)
--    The only invented entities. Names are deliberately systematic
--    ("NAKURU COHORT 03") so nobody mistakes them for real facilities.
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS sample.cohort_assignments;
CREATE TABLE sample.cohort_assignments AS
SELECT
  a.unique_id,
  a.county,
  upper(a.county) || ' COHORT ' ||
    lpad((1 + floor(sample.hrand('cohort', a.unique_id)
      * GREATEST(1, ceil(cnt.n / 800.0)))::int)::text, 2, '0') AS cohort,
  upper(a.county) || ' CDC ' ||
    lpad((1 + floor(sample.hrand('cdc', a.unique_id)
      * GREATEST(1, ceil(cnt.n / 2500.0)))::int)::text, 2, '0') AS cdc_name,
  'CLUSTER ' || chr(65 + floor(sample.hrand('cluster', a.unique_id) * 6)::int) AS cluster,
  'sample'::text AS data_source
FROM sample.learner_attributes a
JOIN (SELECT county, count(*) AS n FROM sample.learner_attributes GROUP BY county) cnt
  USING (county);

CREATE INDEX ON sample.cohort_assignments (unique_id);

-- ---------------------------------------------------------------------------
-- 5. Registry: these datasets are now served from the sample lane.
-- ---------------------------------------------------------------------------
UPDATE app.dataset_registry SET active_source = 'sample', loaded_at = now(),
       row_count = (SELECT count(*) FROM sample.learner_attributes),
       notes = 'Modeled enrichment on real learners. Anchors: KNBS 2019 Census, CA sector stats.'
 WHERE dataset_key IN ('baseline', 'disability_supplement');

UPDATE app.dataset_registry SET active_source = 'sample', loaded_at = now(),
       row_count = (SELECT count(*) FROM sample.enrolment_outcomes),
       notes = 'Modeled journey states on real enrolment records. Completion band 62%.'
 WHERE dataset_key = 'completion';

UPDATE app.dataset_registry SET active_source = 'sample', loaded_at = now(),
       row_count = (SELECT count(*) FROM sample.cohort_assignments),
       notes = 'Synthetic cohort/CDC/cluster structures with systematic names.'
 WHERE dataset_key IN ('county_cohort', 'busia_cohort');

COMMIT;
