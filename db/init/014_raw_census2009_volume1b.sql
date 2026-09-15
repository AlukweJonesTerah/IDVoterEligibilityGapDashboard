-- 2009 census population/households/area/density and single-year age-sex,
-- sourced from KNBS Volume 1B (Population Distribution by Political Units).
-- Untracked PDF added this session:
-- "2009-Kenya-population-and-Housing-Census-Volume-1B-Population-
-- Distribution-by-Political-Units 2.pdf". Loaded verbatim by
-- scripts/seed-eligibility-data.mjs; county-code joins happen in
-- analytics views.
--
-- Extraction note: text pulled from the PDF's tables via pypdf. One page
-- (Taita Taveta's single-year age table, PDF page 260) has a font-encoding
-- defect in the source file that silently drops the "male" column for
-- ages 45-79 -- those 35 rows are absent from
-- raw.census2009_age_sex_county for Taita Taveta only (its Table 1a
-- totals in raw.population_housing_county_2009 are unaffected, since that
-- comes from a different page).

-- County-level population/households/area/density (Table 1a) -- unlike
-- census2009_age_sex_province_district, this is KNBS's OWN reconciliation
-- to modern (2009-era) county boundaries, not a district->county join done
-- by this project's staging layer.
CREATE TABLE IF NOT EXISTS raw.population_housing_county_2009 (
  county                       text,
  male                          integer,
  female                        integer,
  total                         integer,
  households                    integer,
  land_area_sqkm                 numeric,
  density_per_sqkm                numeric
);

-- Constituency-level population/households/area/density (Table 1), grouped
-- by province. 2009 constituency boundaries (210 of them) do not nest
-- cleanly under modern counties without a verified crosswalk, so only
-- province is resolved to a ref view -- see 041 for the join.
CREATE TABLE IF NOT EXISTS raw.population_housing_constituency_2009 (
  province                     text,
  constituency                  text,
  male                          integer,
  female                        integer,
  total                         integer,
  households                    integer,
  land_area_sqkm                 numeric,
  density_per_sqkm                numeric
);

-- Single-year age x sex population by county (Table 2a) -- the county-level
-- counterpart to raw.census2009_age_sex_province_district, but resolved to
-- modern counties directly by KNBS instead of via district reconciliation.
-- Ages 0-79 only (80+ and "Age NS" aggregate rows are not loaded, matching
-- the age_numeric convention used elsewhere in this dataset).
CREATE TABLE IF NOT EXISTS raw.census2009_age_sex_county (
  county   text,
  age       integer,
  male      integer,
  female    integer,
  total     integer
);
