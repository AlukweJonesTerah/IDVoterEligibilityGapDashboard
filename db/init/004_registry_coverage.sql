-- Coverage-aware dataset registry, per the live-data stakeholder refresh plan
-- (docs/plans/live-data-stakeholder-refresh-plan.md §9).
--
-- 'partial' = real source data with limited coverage; 'none' renders in the
-- UI as "unavailable". Coverage columns let widgets state honest denominators
-- ("gender known for 8,9xx records, not all 101k learners").

ALTER TABLE app.dataset_registry DROP CONSTRAINT IF EXISTS dataset_registry_active_source_check;
ALTER TABLE app.dataset_registry
  ADD CONSTRAINT dataset_registry_active_source_check
  CHECK (active_source IN ('actual', 'partial', 'sample', 'none'));

ALTER TABLE app.dataset_registry ADD COLUMN IF NOT EXISTS coverage_count integer;
ALTER TABLE app.dataset_registry ADD COLUMN IF NOT EXISTS coverage_denominator integer;
ALTER TABLE app.dataset_registry ADD COLUMN IF NOT EXISTS coverage_note text;
