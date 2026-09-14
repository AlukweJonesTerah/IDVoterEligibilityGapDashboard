-- Query-facing views: clean types, add a canonical county_code, nothing
-- pre-aggregated. This data is static (loaded once, never mutated at
-- runtime) so there is no materialized-view/refresh-trigger apparatus here
-- the way the old training dashboard needed for its live, growing table --
-- every API route aggregates directly against these views per request.

CREATE OR REPLACE VIEW analytics.census2019_pop AS
SELECT
  r.county,
  r.sub_county,
  r.age,
  r.gender,
  r.population,
  r.adult_category,
  r.government_age_category,
  r.custom_age_band,
  l.county_code
FROM raw.census2019_age_sex_county_subcounty r
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(r.county);

CREATE OR REPLACE VIEW analytics.census2009_pop AS
SELECT
  r.province,
  r.district,
  r.age,
  r.gender,
  r.value AS population,
  r.adult_category,
  r.government_age_category,
  r.custom_age_band,
  d.county_code,
  d.county_name
FROM raw.census2009_age_sex_province_district r
JOIN staging.district_to_county d ON ref.norm_county(d.district) = ref.norm_county(r.district);

CREATE OR REPLACE VIEW analytics.id_holders AS
SELECT
  h.county,
  h.subcounty,
  h.division,
  h.location,
  h.sex,
  h.total,
  l.county_code
FROM raw.id_holders_by_location h
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(h.county)
WHERE h.sex IN ('M', 'F');

-- raw.id_eligibility carries separate rows per (attribute, gender): attribute
-- 'ID HOLDERS' rows are split by gender (Both/Male/Female), 'NO ID HOLDERS'
-- rows only ever carry gender='Both'. `population` is the same location
-- total repeated on every row (max() below is just a safe way to pick it
-- once). Pivoted here into one row per location with clean gap columns,
-- since that's the shape every consuming widget (pivot table, gap map)
-- actually needs.
CREATE OR REPLACE VIEW analytics.id_eligibility AS
SELECT
  e.county_name,
  e.subcounty,
  e.division,
  e.location_name,
  l.county_code,
  max(e.population) AS population,
  sum(e.value) FILTER (WHERE e.attribute = 'ID HOLDERS' AND e.gender = 'Both') AS id_holders,
  sum(e.value) FILTER (WHERE e.attribute = 'NO ID HOLDERS' AND e.gender = 'Both') AS no_id_holders,
  sum(e.value) FILTER (WHERE e.attribute = 'ID HOLDERS' AND e.gender = 'Male') AS id_holders_male,
  sum(e.value) FILTER (WHERE e.attribute = 'ID HOLDERS' AND e.gender = 'Female') AS id_holders_female
FROM raw.id_eligibility e
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(e.county_name)
GROUP BY e.county_name, e.subcounty, e.division, e.location_name, l.county_code;

CREATE OR REPLACE VIEW analytics.registered_voters AS
SELECT
  v.county_name,
  v.registered_voters,
  l.county_code
FROM raw.registered_voters_county v
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(v.county_name);
