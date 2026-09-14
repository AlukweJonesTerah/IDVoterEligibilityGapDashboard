-- Reconciles the 2009 census track (recorded against pre-devolution
-- province/district boundaries) onto the modern 47-county geography, so
-- the 2009 track's province/district slicers can filter the ID-eligibility
-- and registered-voter tables, which only carry modern county codes.

CREATE OR REPLACE VIEW staging.district_to_county AS
SELECT DISTINCT
  m.district,
  c.county_code,
  c.county_name,
  c.former_province
FROM raw.district_county_mapping m
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(m.county)
JOIN ref.counties c ON c.county_code = l.county_code;
