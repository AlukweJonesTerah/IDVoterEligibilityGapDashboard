-- Registry coverage after a live refresh. Runs on the dashboard database;
-- all counts come from the staging reporting layer loaded by
-- scripts/live-refresh.sh.

BEGIN;

UPDATE app.dataset_registry SET active_source = 'partial', loaded_at = now(),
  row_count = (SELECT count(*) FROM staging.registrations),
  coverage_count = (SELECT count(*) FILTER (WHERE gender IS NOT NULL) FROM staging.registrations),
  coverage_denominator = (SELECT count(*) FROM staging.registrations),
  coverage_note = 'Registrations received (intake). No shared learner key to the training table; gender present on a small fraction of rows.',
  notes = 'analytics.pathways_data_updated via staging.registrations. Intake measure only; never summed with trained learners.'
WHERE dataset_key = 'registration';

UPDATE app.dataset_registry SET active_source = 'partial', loaded_at = now(),
  row_count = (SELECT count(*) FROM staging.completion_records),
  coverage_count = (SELECT count(*) FROM staging.completion_records),
  coverage_denominator = (SELECT count(DISTINCT unique_id) FROM analytics.icta_training_data),
  coverage_note = 'Real completion records exist for a tiny pilot slice only; no national completion rate can be computed yet.',
  notes = 'analytics.cluster_1 via staging.completion_records.'
WHERE dataset_key = 'completion';

UPDATE app.dataset_registry SET active_source = 'partial', loaded_at = now(),
  row_count = (SELECT count(*) FROM staging.demographic_pool WHERE source_table = 'cluster_2'),
  coverage_count = (SELECT count(*) FROM staging.demographic_pool WHERE source_table = 'cluster_2'),
  coverage_denominator = (SELECT count(DISTINCT unique_id) FROM analytics.icta_training_data),
  coverage_note = 'Contact and sub-county data for a small record pool.',
  notes = 'analytics.cluster_2 via staging.demographic_pool.'
WHERE dataset_key = 'contacts';

UPDATE app.dataset_registry SET active_source = 'partial', loaded_at = now(),
  row_count = (SELECT count(*) FROM staging.demographic_pool WHERE source_table = 'cluster_3'),
  coverage_count = (SELECT count(*) FROM staging.demographic_pool WHERE source_table = 'cluster_3'),
  coverage_denominator = (SELECT count(DISTINCT unique_id) FROM analytics.icta_training_data),
  coverage_note = 'Busia pilot cohorts with device and internet fields; not national.',
  notes = 'analytics.cluster_3 via staging.demographic_pool.'
WHERE dataset_key = 'busia_cohort';

UPDATE app.dataset_registry SET active_source = 'partial', loaded_at = now(),
  row_count = (SELECT count(*) FROM staging.demographic_pool WHERE source_table IN ('cluster_4','cluster_5','cluster_6','cluster_7')),
  coverage_count = (SELECT count(*) FILTER (WHERE gender IS NOT NULL) FROM staging.demographic_persons),
  coverage_denominator = (SELECT count(DISTINCT unique_id) FROM analytics.icta_training_data),
  coverage_note = 'County, cohort, cluster and demographic data for a partial record pool.',
  notes = 'analytics.cluster_4/5/6/7 via staging.demographic_pool.'
WHERE dataset_key = 'county_cohort';

UPDATE app.dataset_registry SET active_source = 'partial', loaded_at = now(),
  row_count = (SELECT count(*) FROM staging.demographic_pool WHERE source_table IN ('cluster_8','cluster_9','cluster_10')),
  coverage_count = (SELECT count(*) FILTER (WHERE has_disability IS NOT NULL) FROM staging.demographic_persons),
  coverage_denominator = (SELECT count(DISTINCT unique_id) FROM analytics.icta_training_data),
  coverage_note = 'Disability and age supplements for a partial record pool.',
  notes = 'analytics.cluster_8/9/10 via staging.demographic_pool.'
WHERE dataset_key = 'disability_supplement';

UPDATE app.dataset_registry SET active_source = 'none', loaded_at = now(),
  row_count = 0,
  coverage_count = 0,
  coverage_denominator = (SELECT count(DISTINCT unique_id) FROM analytics.icta_training_data),
  coverage_note = 'Baseline table exists in the live database but has no rows; readiness, device/internet, education depth, employment, income, ward/GPS and impact are unavailable.',
  notes = 'analytics.uk_dap_citizens_baseline: schema only, 0 rows at last refresh.'
WHERE dataset_key = 'baseline';

COMMIT;
