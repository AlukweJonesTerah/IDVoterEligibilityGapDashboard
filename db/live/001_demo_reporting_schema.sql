-- Reporting-layer landing tables on the dashboard database.
-- Populated by scripts/live-refresh.sh, which runs read-only, PII-stripping
-- SELECTs against the live icta_dashboard source tables. Only hashed person
-- keys and analytics fields ever leave the live database; names, emails,
-- phones and national IDs stay at source.

CREATE SCHEMA IF NOT EXISTS staging;

CREATE TABLE IF NOT EXISTS staging.demographic_pool (
  person_key text,
  source_table text NOT NULL,
  gender text,
  age_group text,
  has_disability boolean,
  education_level text,
  county text,
  sub_county text,
  has_device boolean,
  cohort text,
  cluster text
);

CREATE TABLE IF NOT EXISTS staging.completion_records (
  quiz_average numeric,
  completion_date date,
  percent_complete numeric
);

CREATE TABLE IF NOT EXISTS staging.registrations (
  course text,
  gender text,
  institution text
);

-- One row per person with best-known attributes across the cluster sources.
CREATE OR REPLACE VIEW staging.demographic_persons AS
SELECT person_key,
       max(gender) AS gender,
       max(age_group) AS age_group,
       bool_or(has_disability) AS has_disability,
       max(education_level) AS education_level,
       max(county) AS county,
       max(sub_county) AS sub_county,
       bool_or(has_device) AS has_device,
       max(cohort) AS cohort,
       max(cluster) AS cluster,
       count(DISTINCT source_table)::int AS source_count
FROM staging.demographic_pool
WHERE person_key IS NOT NULL
GROUP BY person_key;
