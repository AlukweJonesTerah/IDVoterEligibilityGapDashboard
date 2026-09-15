-- Query-facing views over raw.population_housing_*_2019 / raw.urban_centers_2019
-- (013_raw_population_housing_2019.sql). Same shape as 040's views: resolve
-- a canonical county_code, otherwise pass the source columns through as-is.
-- The 'KENYA' national-total rows carried in the raw tables are dropped
-- here since they don't resolve against ref.county_lookup (by design --
-- callers that need the national total sum the per-county rows).

CREATE OR REPLACE VIEW analytics.population_housing_county_2019 AS
SELECT
  r.county,
  r.segment,
  r.total,
  r.male,
  r.female,
  r.intersex,
  r.households_total,
  r.households_conventional,
  r.households_group_quarters,
  r.land_area_sqkm,
  r.density_per_sqkm,
  l.county_code
FROM raw.population_housing_county_2019 r
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(r.county);

CREATE OR REPLACE VIEW analytics.population_housing_subcounty_2019 AS
SELECT
  r.county,
  r.subcounty,
  r.total,
  r.male,
  r.female,
  r.households_total,
  r.households_conventional,
  r.households_group_quarters,
  r.land_area_sqkm,
  r.density_per_sqkm,
  l.county_code
FROM raw.population_housing_subcounty_2019 r
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(r.county);

CREATE OR REPLACE VIEW analytics.population_housing_subloc_2019 AS
SELECT
  r.admin_level,
  r.name,
  r.county,
  r.subcounty,
  r.ward,
  r.location,
  r.sublocation,
  r.total,
  r.male,
  r.female,
  r.households_total,
  r.households_conventional,
  r.households_group_quarters,
  r.land_area_sqkm,
  r.density_per_sqkm,
  l.county_code
FROM raw.population_housing_subloc_2019 r
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(r.county);

-- 13 urban centers straddle two counties in the source table (e.g.
-- "KWALE/KILIFI") and are dropped here since they don't resolve to one
-- county_code -- not a data error, just not representable in this shape.
CREATE OR REPLACE VIEW analytics.urban_centers_2019 AS
SELECT
  u.urban_center,
  u.county,
  u.total,
  u.male,
  u.female,
  l.county_code
FROM raw.urban_centers_2019 u
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(u.county);
