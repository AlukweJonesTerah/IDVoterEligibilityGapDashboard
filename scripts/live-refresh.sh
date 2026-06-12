#!/usr/bin/env bash
# Refresh the dashboard reporting layer from the live source database.
#
# Read-only on live: runs SELECTs that normalize values and strip PII at
# source (md5 person keys; whitelisted gender/yes-no values; no names, emails,
# phones or national IDs are transferred). Writes land in the dashboard DB's
# staging schema, then the dataset registry is updated with coverage.
#
# Usage:
#   PROD_ADMIN_URL=<live url> DATABASE_URL=<dashboard url> scripts/live-refresh.sh
set -euo pipefail

: "${PROD_ADMIN_URL:?set PROD_ADMIN_URL to the live source database url}"
: "${DATABASE_URL:?set DATABASE_URL to the dashboard database url}"

PKEY="md5(coalesce(nullif(lower(trim(EMAIL)),''), nullif(regexp_replace(coalesce(PHONE,''),'\D','','g'),''), nullif(upper(trim(NAME)),'')))"
GEN="CASE upper(trim(gender)) WHEN 'MALE' THEN 'MALE' WHEN 'M' THEN 'MALE' WHEN 'FEMALE' THEN 'FEMALE' WHEN 'F' THEN 'FEMALE' ELSE NULL END"
YN() { echo "CASE upper(trim($1)) WHEN 'YES' THEN true WHEN 'NO' THEN false ELSE NULL::boolean END"; }
pk() { echo "$PKEY" | sed "s/EMAIL/$1/; s/PHONE/$2/; s/NAME/$3/"; }

echo "Preparing dashboard staging schema ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f db/live/001_demo_reporting_schema.sql
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -c "TRUNCATE staging.demographic_pool, staging.completion_records, staging.registrations"

echo "Transferring demographic pool (PII stripped at source) ..."
psql "$PROD_ADMIN_URL" -v ON_ERROR_STOP=1 -c "COPY (
  SELECT $(pk email_address phone_number full_name), 'cluster_2', $GEN,
         NULL, NULL::boolean, NULL, NULL, nullif(trim(sub_county),''), NULL::boolean, NULL, NULL
  FROM analytics.cluster_2
  UNION ALL
  SELECT $(pk email_address phone_number full_name), 'cluster_3', $GEN,
         nullif(replace(trim(age_group),' to ','-'),''), NULL, nullif(trim(education_level),''), NULL,
         nullif(trim(sub_county),''), $(YN device_availability), nullif(trim(cohort),''), nullif(trim(cluster),'')
  FROM analytics.cluster_3
  UNION ALL
  SELECT $(pk email phone "concat_ws(' ', first_name, last_name)"), 'cluster_4', $GEN,
         NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
  FROM analytics.cluster_4
  UNION ALL
  SELECT $(pk email_address phone_number full_name), 'cluster_5', $GEN,
         nullif(replace(trim(age_group),' to ','-'),''), NULL, nullif(trim(education_level),''),
         nullif(trim(county),''), nullif(trim(sub_county),''), NULL, nullif(trim(cohort),''), nullif(trim(cluster),'')
  FROM analytics.cluster_5
  UNION ALL
  SELECT $(pk email phone "concat_ws(' ', first_name, last_name)"), 'cluster_6', $GEN,
         NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
  FROM analytics.cluster_6
  UNION ALL
  SELECT $(pk email_address phone_number full_name), 'cluster_7', $GEN,
         nullif(replace(trim(age_group),' to ','-'),''), NULL, NULL, NULL, NULL, NULL, NULL, NULL
  FROM analytics.cluster_7
  UNION ALL
  SELECT $(pk email_address phone_number full_name), 'cluster_8', $GEN,
         nullif(replace(trim(age_group),' to ','-'),''), $(YN disability_status), NULL, NULL, nullif(trim(subcounty),''), NULL, NULL, NULL
  FROM analytics.cluster_8
  UNION ALL
  SELECT $(pk email_address phone_number full_name), 'cluster_9', $GEN,
         nullif(replace(trim(age_group),' to ','-'),''), $(YN disability_status), NULL,
         nullif(trim(county),''), nullif(trim(subcounty),''), NULL, NULL, NULL
  FROM analytics.cluster_9
  UNION ALL
  SELECT $(pk email_address phone_number full_name), 'cluster_10', $GEN,
         nullif(replace(trim(age_group),' to ','-'),''), NULL, NULL, NULL, nullif(trim(subcounty),''), NULL, NULL, NULL
  FROM analytics.cluster_10
) TO STDOUT" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "COPY staging.demographic_pool FROM STDIN"

echo "Transferring completion records ..."
psql "$PROD_ADMIN_URL" -v ON_ERROR_STOP=1 -c "COPY (
  SELECT quiz_average, completion_date::date, percent_complete
  FROM analytics.cluster_1
  WHERE completion_date IS NOT NULL OR percent_complete > 0
) TO STDOUT" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "COPY staging.completion_records FROM STDIN"

echo "Transferring registrations (header rows removed) ..."
psql "$PROD_ADMIN_URL" -v ON_ERROR_STOP=1 -c "COPY (
  SELECT nullif(trim(course_taken),''), $GEN, nullif(trim(institution),'')
  FROM analytics.pathways_data_updated
  WHERE upper(coalesce(participant_name,'')) <> 'NAME'
    AND upper(coalesce(course_taken,'')) <> 'COURSE'
) TO STDOUT" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "COPY staging.registrations FROM STDIN"

echo "Updating dataset registry coverage ..."
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -q -f db/live/002_registry_refresh.sql

psql "$DATABASE_URL" -c "
  SELECT 'demographic_pool' t, count(*) FROM staging.demographic_pool
  UNION ALL SELECT 'demographic_persons', count(*) FROM staging.demographic_persons
  UNION ALL SELECT 'completion_records', count(*) FROM staging.completion_records
  UNION ALL SELECT 'registrations', count(*) FROM staging.registrations;"
echo "Refresh complete."
