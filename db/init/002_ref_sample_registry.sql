-- Reference (always-real lookups), sample (modeled gap-fill), and the dataset
-- registry that records which lane currently feeds each expected dataset.
-- See docs/plans/sample-data-lane-plan.md.

CREATE SCHEMA IF NOT EXISTS ref;
CREATE SCHEMA IF NOT EXISTS sample;

CREATE TABLE IF NOT EXISTS app.dataset_registry (
  dataset_key    text PRIMARY KEY,
  display_name   text NOT NULL,
  expected_table text NOT NULL,
  active_source  text NOT NULL DEFAULT 'none'
                 CHECK (active_source IN ('actual', 'sample', 'none')),
  loaded_at      timestamptz,
  row_count      integer,
  notes          text
);

INSERT INTO app.dataset_registry (dataset_key, display_name, expected_table, active_source, notes) VALUES
  ('training_records', 'Training records (flattened summary)', 'analytics.icta_training_data', 'none',
   'Flattened virtual-training export. Set to actual where the table is loaded.'),
  ('registration', 'Dataset 1: Learner course registration', 'raw.learner_registration', 'none',
   'Name, gender, email, course, institution.'),
  ('baseline', 'Dataset 2: Learner baseline & digital skills assessment', 'raw.learner_baseline', 'none',
   'Demographics, geography to village, disability, education, employment, device/internet, competency blocks, GPS. Contains PII.'),
  ('completion', 'Dataset 3: Course completion & assessment', 'raw.course_completion', 'none',
   'Quiz average, completion date, % complete.'),
  ('contacts', 'Dataset 4: Learner contact & sub-county registration', 'raw.learner_contacts', 'none',
   'Supplemental contact and sub-county data.'),
  ('busia_cohort', 'Dataset 5: Busia cohort / cluster', 'raw.busia_cohort', 'none',
   'Busia pilot cohorts, clusters, device and internet readiness.'),
  ('county_cohort', 'Dataset 6: County, cohort, and cluster', 'raw.county_cohort', 'none',
   'Cohort and cluster tracking with county/sub-county demographics.'),
  ('disability_supplement', 'Dataset 7: Disability, age, county supplement', 'raw.disability_supplement', 'none',
   'Disability status, age group, county/sub-county supplementation.')
ON CONFLICT (dataset_key) DO NOTHING;

-- Raw landing tables for the seven source datasets, columns per the
-- data-grounded requirements doc (docs/requirements/mark-data-grounded-requirements.md).
-- Loaded as-is by the data team; cleaning happens in staging.

CREATE TABLE IF NOT EXISTS raw.learner_registration (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text,
  gender text,
  email text,
  course text,
  institution text,
  loaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw.learner_baseline (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text,
  national_id text,
  mobile_phone text,
  county text,
  subcounty text,
  ward text,
  village_town text,
  gender text,
  age integer,
  disability_status text,
  disability_type text,
  assistive_devices text,
  education_level text,
  primary_language text,
  digital_skills_self_rating text,
  income_generating_activity text,
  monthly_income text,
  internet_access_frequency text,
  device_access text,
  employment_status text,
  cdc_name text,
  cdc_phone text,
  device_competency jsonb,
  communication_competency jsonb,
  commerce_competency jsonb,
  gov_services_competency jsonb,
  cybersecurity_competency jsonb,
  ewaste_competency jsonb,
  digital_development_metrics jsonb,
  gps_latitude double precision,
  gps_longitude double precision,
  gps_altitude double precision,
  gps_precision double precision,
  source_id text,
  source_uuid text,
  unique_id text,
  loaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw.course_completion (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text,
  first_name text,
  last_name text,
  username text,
  email text,
  quiz_average numeric,
  completion_date date,
  pct_complete numeric,
  loaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw.learner_contacts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text,
  gender text,
  phone text,
  email text,
  subcounty text,
  loaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw.busia_cohort (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text,
  phone text,
  email text,
  subcounty text,
  cluster text,
  gender text,
  cohort text,
  label text,
  device_access text,
  age_group text,
  device_type text,
  internet_type text,
  education_level text,
  loaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw.county_cohort (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name text,
  phone text,
  email text,
  gender text,
  county text,
  subcounty text,
  age_group text,
  education_level text,
  cluster text,
  cohort text,
  loaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS raw.disability_supplement (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text,
  full_name text,
  phone text,
  gender text,
  disability_status text,
  age_group text,
  county text,
  subcounty text,
  loaded_at timestamptz NOT NULL DEFAULT now()
);
