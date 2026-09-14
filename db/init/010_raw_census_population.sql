-- Raw landing tables for Kenya census population data, sourced from the
-- national ID/voter-eligibility Power BI report. Loaded verbatim (as text
-- where the source is inconsistent) by scripts/seed-eligibility-data.mjs
-- from db/seed-data/*.csv; cleaning and county-code joins happen in `ref`
-- views and `analytics` views layered on top, not here.

-- 2019 census: age/sex population by county and sub-county
-- (KNBS 2019 Census Volume III), one row per county+subcounty+age+gender.
CREATE TABLE IF NOT EXISTS raw.census2019_age_sex_county_subcounty (
  county                   text,
  sub_county                text,
  age                       integer,
  total                     integer,
  gender                    text,
  population                integer,
  government_age_category  text,
  current_year_population  integer,
  adult_category            text,
  current_age               integer,
  county_code               integer,
  subcounty_code            text, -- alphanumeric, e.g. "15A"
  custom_age_band            text, -- decade bands with the threshold age isolated, e.g. "0-9","10","11-20"
  county_subcounty_key      text
);

-- 2009 census: age/sex population by province and district (pre-devolution
-- administrative boundaries), one row per province+district+age+gender.
CREATE TABLE IF NOT EXISTS raw.census2009_age_sex_province_district (
  province                  text,
  district                  text,
  age                       integer,
  gender                    text,
  value                     integer,
  current_age               integer,
  adult_category             text,
  age_numeric                integer,
  current_year_population   integer,
  custom_age_band            text,
  government_age_category   text
);

-- Current national-ID-holder counts by administrative location and sex.
-- Same shape as the county/subcounty/division/location scheme used by
-- raw.id_eligibility. Despite the source filename ("STATISTIC22_02_26ALL",
-- dated 2026-02-22), this is confirmed (via the report's own DAX measure
-- Total_IDs_2026) to represent ID holders, not general population.
-- (Numeric sub-county/division/location codes from the source are dropped:
-- pbixray decodes that particular column's encoding to garbage values, and
-- they were mostly NULL in the source anyway -- the text name columns are
-- the real join keys.)
CREATE TABLE IF NOT EXISTS raw.id_holders_by_location (
  cnt_code     integer,
  county        text,
  subcounty     text,
  division      text,
  location      text,
  sex           text,
  total         integer
);

-- KNBS 2019 Census county totals by sex (cross-check against
-- ref.counties.population_2019, which is the same Volume I figures).
CREATE TABLE IF NOT EXISTS raw.population_by_county_2019 (
  county                 text,
  male                    integer,
  female                  integer,
  intersex                integer,
  total                   integer,
  population_with_ids     integer
);

-- KNBS 2019 Census sub-county totals by sex.
CREATE TABLE IF NOT EXISTS raw.population_by_subcounty_2019 (
  subcounty  text,
  male        integer,
  female      integer,
  intersex    integer,
  total       integer,
  county      text
);

-- Sub-location-level population by gender (finest granularity available;
-- not required by v1 queries, loaded for completeness).
CREATE TABLE IF NOT EXISTS raw.population_unpivot (
  county       text,
  subcounty     text,
  location      text,
  sublocation   text,
  gender        text,
  population    integer
);
