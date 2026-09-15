-- Query-facing views over raw.population_housing_*_2009 /
-- raw.census2009_age_sex_county (014_raw_census2009_volume1b.sql).

CREATE OR REPLACE VIEW analytics.population_housing_county_2009 AS
SELECT
  r.county,
  r.male,
  r.female,
  r.total,
  r.households,
  r.land_area_sqkm,
  r.density_per_sqkm,
  l.county_code
FROM raw.population_housing_county_2009 r
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(r.county);

-- No county_code here: 2009 constituency boundaries don't nest cleanly
-- under modern counties without a verified crosswalk (see 014's header
-- comment), so this is grouped by province only.
CREATE OR REPLACE VIEW analytics.population_housing_constituency_2009 AS
SELECT
  r.province,
  r.constituency,
  r.male,
  r.female,
  r.total,
  r.households,
  r.land_area_sqkm,
  r.density_per_sqkm
FROM raw.population_housing_constituency_2009 r;

CREATE OR REPLACE VIEW analytics.census2009_pop_county AS
SELECT
  r.county,
  r.age,
  r.male,
  r.female,
  r.total AS population,
  l.county_code
FROM raw.census2009_age_sex_county r
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(r.county);
