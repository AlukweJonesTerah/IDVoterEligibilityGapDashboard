-- Dashboard optimization layer for analytics."20_million_by_2032".
--
-- These materialized views keep the raw combined table as the source of truth
-- while precomputing the expensive unfiltered dashboard aggregates.

DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_pipeline_daily_activity_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_cohort_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_completion_trend_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_pipeline_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_device_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_education_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_disability_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_age_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_gender_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_course_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_course_category_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_county_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_partner_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_overview_summary_mv;
DROP MATERIALIZED VIEW IF EXISTS analytics.dashboard_people_mv;

CREATE MATERIALIZED VIEW analytics.dashboard_people_mv AS
SELECT DISTINCT ON (person_key)
       person_key,
       gender,
       age_band,
       disability_status,
       education_level,
       has_device,
       has_device_known
FROM (
  SELECT coalesce(
           nullif(trim(national_id), ''),
           nullif(regexp_replace(coalesce(phone_number, ''), '[^0-9]+', '', 'g'), ''),
           nullif(lower(trim(email)), ''),
           nullif(trim(survey_uuid), ''),
           nullif(trim(record_id), '')
         ) AS person_key,
         nullif(trim(gender), '') AS gender,
         CASE
           WHEN age_group IS NULL OR trim(age_group) = '' THEN NULL
           WHEN regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '18%' THEN '18-24'
           WHEN regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '25%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '26%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '27%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '28%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '29%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '30%' THEN '25-34'
           WHEN regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '35%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '36%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE 'above35%' THEN '35+'
           WHEN regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '45%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '46%' THEN '45-54'
           WHEN regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '55%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '65%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '66%'
             OR regexp_replace(lower(coalesce(age_group, '')), '[^a-z0-9]+', '', 'g') LIKE '70%' THEN '55+'
           ELSE trim(age_group)
         END AS age_band,
         nullif(trim(disability_status), '') AS disability_status,
         (
           lower(trim(coalesce(has_device, ''))) IN ('yes', 'y', 'true', '1')
           OR device_used IS NOT NULL AND trim(device_used) <> ''
           OR device_type IS NOT NULL AND trim(device_type) <> ''
         ) AS has_device,
         (
           has_device IS NOT NULL AND trim(has_device) <> ''
           OR device_used IS NOT NULL AND trim(device_used) <> ''
           OR device_type IS NOT NULL AND trim(device_type) <> ''
         ) AS has_device_known,
         nullif(trim(education_level), '') AS education_level
  FROM analytics."20_million_by_2032"
) p
ORDER BY person_key,
  CASE WHEN gender IS NOT NULL THEN 0 ELSE 1 END,
  CASE WHEN age_band IS NOT NULL THEN 0 ELSE 1 END,
  CASE WHEN education_level IS NOT NULL THEN 0 ELSE 1 END;

CREATE UNIQUE INDEX dashboard_people_mv_person_key_idx ON analytics.dashboard_people_mv (person_key);

CREATE MATERIALIZED VIEW analytics.dashboard_overview_summary_mv AS
WITH kenya_counties(county_norm, county_name) AS (
  VALUES
    ('mombasa','Mombasa'), ('kwale','Kwale'), ('kilifi','Kilifi'), ('tanariver','Tana River'),
    ('lamu','Lamu'), ('taitataveta','Taita-Taveta'), ('garissa','Garissa'), ('wajir','Wajir'),
    ('mandera','Mandera'), ('marsabit','Marsabit'), ('isiolo','Isiolo'), ('meru','Meru'),
    ('tharakanithi','Tharaka-Nithi'), ('embu','Embu'), ('kitui','Kitui'), ('machakos','Machakos'),
    ('makueni','Makueni'), ('nyandarua','Nyandarua'), ('nyeri','Nyeri'), ('kirinyaga','Kirinyaga'),
    ('muranga','Murang''a'), ('kiambu','Kiambu'), ('turkana','Turkana'), ('westpokot','West Pokot'),
    ('samburu','Samburu'), ('transnzoia','Trans Nzoia'), ('uasingishu','Uasin Gishu'),
    ('elgeyomarakwet','Elgeyo-Marakwet'), ('nandi','Nandi'), ('baringo','Baringo'),
    ('laikipia','Laikipia'), ('nakuru','Nakuru'), ('narok','Narok'), ('kajiado','Kajiado'),
    ('kericho','Kericho'), ('bomet','Bomet'), ('kakamega','Kakamega'), ('vihiga','Vihiga'),
    ('bungoma','Bungoma'), ('busia','Busia'), ('siaya','Siaya'), ('kisumu','Kisumu'),
    ('homabay','Homa Bay'), ('migori','Migori'), ('kisii','Kisii'), ('nyamira','Nyamira'),
    ('nairobi','Nairobi')
),
raw AS (
  SELECT * FROM analytics."20_million_by_2032"
),
raw_totals AS (
  SELECT count(*)::int AS enrolments,
         count(DISTINCT course_taken) FILTER (WHERE course_taken IS NOT NULL AND trim(course_taken) <> '')::int AS courses,
         min(date_trained)::text AS first_date,
         max(date_trained)::text AS last_date,
         count(DISTINCT source)::int AS sources,
         count(*) FILTER (WHERE gender IS NOT NULL AND trim(gender) <> '')::int AS source_gender_known
  FROM raw
),
county_totals AS (
  SELECT count(DISTINCT kc.county_norm)::int AS counties
  FROM raw r
  JOIN kenya_counties kc
    ON kc.county_norm = regexp_replace(lower(coalesce(r.county, '')), '[^a-z0-9]+', '', 'g')
),
people_totals AS (
  SELECT count(*)::int AS unique_learners,
         count(gender)::int AS gender_known,
         count(*) FILTER (WHERE lower(trim(gender)) = 'female')::int AS female,
         count(age_band)::int AS age_known,
         count(*) FILTER (WHERE age_band IN ('18-24','25-34'))::int AS youth,
         count(disability_status)::int AS disability_known,
         count(*) FILTER (WHERE lower(trim(disability_status)) = 'yes')::int AS pwd,
         count(*) FILTER (WHERE has_device_known)::int AS device_known,
         count(*) FILTER (WHERE has_device_known AND has_device)::int AS with_device,
         count(education_level)::int AS education_known
  FROM analytics.dashboard_people_mv
),
completion_totals AS (
  SELECT count(*)::int AS completion_records,
         round(avg(quiz_average), 1)::float AS avg_quiz,
         count(*) FILTER (WHERE pct_complete >= 100 OR completion_date IS NOT NULL)::int AS completed
  FROM raw
  WHERE pct_complete IS NOT NULL OR completion_date IS NOT NULL
)
SELECT raw_totals.*,
       county_totals.counties,
       people_totals.*,
       completion_totals.completion_records,
       completion_totals.avg_quiz,
       completion_totals.completed
FROM raw_totals, county_totals, people_totals, completion_totals;

CREATE UNIQUE INDEX dashboard_overview_summary_mv_one_idx ON analytics.dashboard_overview_summary_mv ((true));

CREATE MATERIALIZED VIEW analytics.dashboard_partner_summary_mv AS
SELECT trim(partner) AS partner,
       count(*)::int AS records
FROM analytics."20_million_by_2032"
WHERE partner IS NOT NULL AND trim(partner) <> ''
GROUP BY trim(partner);

CREATE UNIQUE INDEX dashboard_partner_summary_mv_partner_idx ON analytics.dashboard_partner_summary_mv (partner);

CREATE MATERIALIZED VIEW analytics.dashboard_county_summary_mv AS
WITH kenya_counties(county_norm, county_name) AS (
  VALUES
    ('mombasa','Mombasa'), ('kwale','Kwale'), ('kilifi','Kilifi'), ('tanariver','Tana River'),
    ('lamu','Lamu'), ('taitataveta','Taita-Taveta'), ('garissa','Garissa'), ('wajir','Wajir'),
    ('mandera','Mandera'), ('marsabit','Marsabit'), ('isiolo','Isiolo'), ('meru','Meru'),
    ('tharakanithi','Tharaka-Nithi'), ('embu','Embu'), ('kitui','Kitui'), ('machakos','Machakos'),
    ('makueni','Makueni'), ('nyandarua','Nyandarua'), ('nyeri','Nyeri'), ('kirinyaga','Kirinyaga'),
    ('muranga','Murang''a'), ('kiambu','Kiambu'), ('turkana','Turkana'), ('westpokot','West Pokot'),
    ('samburu','Samburu'), ('transnzoia','Trans Nzoia'), ('uasingishu','Uasin Gishu'),
    ('elgeyomarakwet','Elgeyo-Marakwet'), ('nandi','Nandi'), ('baringo','Baringo'),
    ('laikipia','Laikipia'), ('nakuru','Nakuru'), ('narok','Narok'), ('kajiado','Kajiado'),
    ('kericho','Kericho'), ('bomet','Bomet'), ('kakamega','Kakamega'), ('vihiga','Vihiga'),
    ('bungoma','Bungoma'), ('busia','Busia'), ('siaya','Siaya'), ('kisumu','Kisumu'),
    ('homabay','Homa Bay'), ('migori','Migori'), ('kisii','Kisii'), ('nyamira','Nyamira'),
    ('nairobi','Nairobi')
)
SELECT kc.county_name AS county,
       kc.county_name AS county_label,
       count(DISTINCT coalesce(
         nullif(trim(t.national_id), ''),
         nullif(regexp_replace(coalesce(t.phone_number, ''), '[^0-9]+', '', 'g'), ''),
         nullif(lower(trim(t.email)), ''),
         nullif(trim(t.survey_uuid), ''),
         nullif(trim(t.record_id), '')
       ))::int AS learners,
       count(*)::int AS enrolments,
       NULL::int AS population,
       NULL::float AS per_100k
FROM analytics."20_million_by_2032" t
JOIN kenya_counties kc
  ON kc.county_norm = regexp_replace(lower(coalesce(t.county, '')), '[^a-z0-9]+', '', 'g')
GROUP BY kc.county_name;

CREATE UNIQUE INDEX dashboard_county_summary_mv_county_idx ON analytics.dashboard_county_summary_mv (county);

CREATE MATERIALIZED VIEW analytics.dashboard_course_category_summary_mv AS
SELECT course_category AS category,
       course_category,
       count(*)::int AS enrolments,
       count(DISTINCT coalesce(
         nullif(trim(national_id), ''),
         nullif(regexp_replace(coalesce(phone_number, ''), '[^0-9]+', '', 'g'), ''),
         nullif(lower(trim(email)), ''),
         nullif(trim(survey_uuid), ''),
         nullif(trim(record_id), '')
       ))::int AS learners
FROM analytics."20_million_by_2032"
WHERE trim(source) IN ('Training', 'Ajira Portal', 'ICTA Standards')
  AND course_category IS NOT NULL AND trim(course_category) <> ''
GROUP BY course_category;

CREATE UNIQUE INDEX dashboard_course_category_summary_mv_category_idx ON analytics.dashboard_course_category_summary_mv (category);

CREATE MATERIALIZED VIEW analytics.dashboard_course_summary_mv AS
SELECT course_taken AS course,
       course_category AS category,
       count(*)::int AS enrolments,
       count(DISTINCT coalesce(
         nullif(trim(national_id), ''),
         nullif(regexp_replace(coalesce(phone_number, ''), '[^0-9]+', '', 'g'), ''),
         nullif(lower(trim(email)), ''),
         nullif(trim(survey_uuid), ''),
         nullif(trim(record_id), '')
       ))::int AS learners
FROM analytics."20_million_by_2032"
WHERE trim(source) IN ('Training', 'Ajira Portal', 'ICTA Standards')
  AND course_taken IS NOT NULL AND trim(course_taken) <> ''
GROUP BY course_taken, course_category;

CREATE UNIQUE INDEX dashboard_course_summary_mv_course_idx ON analytics.dashboard_course_summary_mv (course, category);

CREATE MATERIALIZED VIEW analytics.dashboard_gender_summary_mv AS
SELECT gender AS label, count(*)::int AS learners
FROM analytics.dashboard_people_mv
WHERE gender IS NOT NULL
GROUP BY gender;

CREATE UNIQUE INDEX dashboard_gender_summary_mv_label_idx ON analytics.dashboard_gender_summary_mv (label);

CREATE MATERIALIZED VIEW analytics.dashboard_age_summary_mv AS
SELECT age_band AS label, count(*)::int AS learners
FROM analytics.dashboard_people_mv
WHERE age_band IS NOT NULL
GROUP BY age_band;

CREATE UNIQUE INDEX dashboard_age_summary_mv_label_idx ON analytics.dashboard_age_summary_mv (label);

CREATE MATERIALIZED VIEW analytics.dashboard_disability_summary_mv AS
SELECT CASE WHEN lower(trim(disability_status)) = 'yes' THEN 'REPORTED DISABILITY' ELSE 'NO DISABILITY' END AS label,
       count(*)::int AS learners
FROM analytics.dashboard_people_mv
WHERE disability_status IS NOT NULL
GROUP BY 1;

CREATE UNIQUE INDEX dashboard_disability_summary_mv_label_idx ON analytics.dashboard_disability_summary_mv (label);

CREATE MATERIALIZED VIEW analytics.dashboard_education_summary_mv AS
SELECT education_level AS label, count(*)::int AS learners
FROM analytics.dashboard_people_mv
WHERE education_level IS NOT NULL
GROUP BY education_level;

CREATE UNIQUE INDEX dashboard_education_summary_mv_label_idx ON analytics.dashboard_education_summary_mv (label);

CREATE MATERIALIZED VIEW analytics.dashboard_device_summary_mv AS
SELECT CASE WHEN has_device THEN 'HAS DEVICE' ELSE 'NO DEVICE' END AS label,
       count(*)::int AS learners
FROM analytics.dashboard_people_mv
WHERE has_device_known
GROUP BY 1;

CREATE UNIQUE INDEX dashboard_device_summary_mv_label_idx ON analytics.dashboard_device_summary_mv (label);

CREATE MATERIALIZED VIEW analytics.dashboard_pipeline_summary_mv AS
WITH training AS (
  SELECT count(DISTINCT coalesce(
           nullif(trim(national_id), ''),
           nullif(regexp_replace(coalesce(phone_number, ''), '[^0-9]+', '', 'g'), ''),
           nullif(lower(trim(email)), ''),
           nullif(trim(survey_uuid), ''),
           nullif(trim(record_id), '')
         ))::int AS registered,
         count(*)::int AS enrolled
  FROM analytics."20_million_by_2032"
  WHERE trim(source) IN ('Training', 'Ajira Portal', 'ICTA Standards')
),
completion AS (
  SELECT count(*)::int AS records,
         round(avg(quiz_average), 1)::float AS avg_quiz,
         count(*) FILTER (WHERE pct_complete >= 100 OR completion_date IS NOT NULL)::int AS completed,
         min(completion_date)::text AS first_date,
         max(completion_date)::text AS last_date
  FROM analytics."20_million_by_2032"
  WHERE pct_complete IS NOT NULL OR completion_date IS NOT NULL
)
SELECT training.registered, training.enrolled,
       completion.records, completion.avg_quiz, completion.completed,
       completion.first_date, completion.last_date
FROM training, completion;

CREATE UNIQUE INDEX dashboard_pipeline_summary_mv_one_idx ON analytics.dashboard_pipeline_summary_mv ((true));

CREATE MATERIALIZED VIEW analytics.dashboard_completion_trend_mv AS
SELECT completion_date::text AS day, count(*)::int AS completions
FROM analytics."20_million_by_2032"
WHERE completion_date IS NOT NULL
GROUP BY 1;

CREATE UNIQUE INDEX dashboard_completion_trend_mv_day_idx ON analytics.dashboard_completion_trend_mv (day);

CREATE MATERIALIZED VIEW analytics.dashboard_cohort_summary_mv AS
SELECT cohort,
       count(*)::int AS learners,
       count(*) FILTER (WHERE gender IS NOT NULL AND trim(gender) <> '')::int AS gender_known
FROM analytics."20_million_by_2032"
WHERE cohort IS NOT NULL AND trim(cohort) <> ''
GROUP BY cohort;

CREATE UNIQUE INDEX dashboard_cohort_summary_mv_cohort_idx ON analytics.dashboard_cohort_summary_mv (cohort);

CREATE MATERIALIZED VIEW analytics.dashboard_pipeline_daily_activity_mv AS
SELECT date_trained::text AS day,
       count(*)::int AS enrolments,
       count(DISTINCT coalesce(
         nullif(trim(national_id), ''),
         nullif(regexp_replace(coalesce(phone_number, ''), '[^0-9]+', '', 'g'), ''),
         nullif(lower(trim(email)), ''),
         nullif(trim(survey_uuid), ''),
         nullif(trim(record_id), '')
       ))::int AS learners
FROM analytics."20_million_by_2032"
WHERE trim(source) IN ('Training', 'Ajira Portal', 'ICTA Standards')
  AND date_trained IS NOT NULL
GROUP BY 1;

CREATE UNIQUE INDEX dashboard_pipeline_daily_activity_mv_day_idx ON analytics.dashboard_pipeline_daily_activity_mv (day);

ANALYZE analytics.dashboard_people_mv;
ANALYZE analytics.dashboard_overview_summary_mv;
ANALYZE analytics.dashboard_partner_summary_mv;
ANALYZE analytics.dashboard_county_summary_mv;
ANALYZE analytics.dashboard_course_category_summary_mv;
ANALYZE analytics.dashboard_course_summary_mv;
ANALYZE analytics.dashboard_gender_summary_mv;
ANALYZE analytics.dashboard_age_summary_mv;
ANALYZE analytics.dashboard_disability_summary_mv;
ANALYZE analytics.dashboard_education_summary_mv;
ANALYZE analytics.dashboard_device_summary_mv;
ANALYZE analytics.dashboard_pipeline_summary_mv;
ANALYZE analytics.dashboard_completion_trend_mv;
ANALYZE analytics.dashboard_cohort_summary_mv;
ANALYZE analytics.dashboard_pipeline_daily_activity_mv;
