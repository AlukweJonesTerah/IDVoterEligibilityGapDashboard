-- 2019 census population, households, land area and density -- sourced from
-- KNBS "2019 KPHC Basic Reports Volume II: Population and Household
-- Distribution by Administrative Units" (already tracked in the repo as
-- "2019 KPHC Basic Reports - Volume_II 2.xlsx", not previously ingested).
-- Loaded verbatim by scripts/seed-eligibility-data.mjs from
-- db/seed-data/*.csv; county-code joins happen in analytics views.

-- County-level population by rural/urban segment (Tables 1/1a/1b): one row
-- per county per segment ('total'/'rural'/'urban'), plus a 'KENYA' row for
-- the national total.
CREATE TABLE IF NOT EXISTS raw.population_housing_county_2019 (
  county                       text,
  segment                       text, -- 'total' | 'rural' | 'urban'
  total                         integer,
  male                          integer,
  female                        integer,
  intersex                      integer,
  households_total              integer,
  households_conventional       integer,
  households_group_quarters     integer,
  land_area_sqkm                 numeric,
  density_per_sqkm                numeric
);

-- Sub-county-level population, households, land area and density (Table 2),
-- total only (no rural/urban split published at this granularity).
CREATE TABLE IF NOT EXISTS raw.population_housing_subcounty_2019 (
  county                       text,
  subcounty                     text,
  total                         integer,
  male                          integer,
  female                        integer,
  households_total              integer,
  households_conventional       integer,
  households_group_quarters     integer,
  land_area_sqkm                 numeric,
  density_per_sqkm                numeric
);

-- Full county > subcounty > ward > location > sub-location tree (Table 3),
-- one row per node at every level (not just leaves) since households/land
-- area/density are published at each level, not just derivable by summing
-- children. `admin_level` says which level a given row represents; the
-- ancestor columns are filled in down to that level and null below it.
CREATE TABLE IF NOT EXISTS raw.population_housing_subloc_2019 (
  admin_level                  text, -- 'county' | 'subcounty' | 'ward' | 'location' | 'sublocation'
  name                          text,
  county                        text,
  subcounty                     text,
  ward                          text,
  location                      text,
  sublocation                   text,
  total                         integer,
  male                          integer,
  female                        integer,
  households_total              integer,
  households_conventional       integer,
  households_group_quarters     integer,
  land_area_sqkm                 numeric,
  density_per_sqkm                numeric
);

-- Named urban centers (Table 4) -- a cross-cutting dimension distinct from
-- gazetted administrative units; several urban centers share a name with
-- their parent county (e.g. Mombasa, Nakuru).
CREATE TABLE IF NOT EXISTS raw.urban_centers_2019 (
  urban_center   text,
  county          text,
  total           integer,
  male            integer,
  female          integer
);
