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

-- The source tables use inconsistent age buckets ("18-24", "26-29", "36-45",
-- "55-64", "66", ...). Harmonize them into standard ranges by the band's lower
-- bound so charts read cleanly. Raw age_group is preserved for audit.
CREATE OR REPLACE FUNCTION staging.norm_age_band(text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN $1 IS NULL THEN NULL
    WHEN (regexp_match($1, '(\d+)'))[1] IS NULL THEN NULL
    WHEN (regexp_match($1, '(\d+)'))[1]::int < 25 THEN '18-24'
    WHEN (regexp_match($1, '(\d+)'))[1]::int < 35 THEN '25-34'
    WHEN (regexp_match($1, '(\d+)'))[1]::int < 45 THEN '35-44'
    WHEN (regexp_match($1, '(\d+)'))[1]::int < 55 THEN '45-54'
    ELSE '55+'
  END
$$;

-- One row per person with best-known attributes across the cluster sources.
DROP VIEW IF EXISTS staging.demographic_persons;
CREATE VIEW staging.demographic_persons AS
SELECT person_key,
       max(gender) AS gender,
       max(age_group) AS age_group,
       staging.norm_age_band(max(age_group)) AS age_band,
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
