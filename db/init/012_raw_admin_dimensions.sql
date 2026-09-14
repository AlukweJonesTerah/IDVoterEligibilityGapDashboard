-- Administrative-unit dimension/lookup tables, loaded verbatim. `ref.*`
-- views (020_ref_geo_views.sql) layer canonical county_code joins on top.

CREATE TABLE IF NOT EXISTS raw.dim_county (
  county  text
);

CREATE TABLE IF NOT EXISTS raw.dim_subcounty (
  subcounty              text,
  county                  text,
  county_subcounty_key    text
);

CREATE TABLE IF NOT EXISTS raw.kenya_county_codes (
  county_code  integer,
  county        text
);

CREATE TABLE IF NOT EXISTS raw.subcounty_codes (
  subcounty_code  integer,
  subcounty        text
);

-- Maps each of the 158 pre-devolution census districts (1999/2009-era) to
-- its modern county, needed to reconcile the 2009 (district-based) track
-- onto today's county geography. See staging.district_to_county.
CREATE TABLE IF NOT EXISTS raw.district_county_mapping (
  seq_no    integer,
  district   text,
  county     text
);

-- 292 constituencies (2012 boundaries) and their parent county, for the
-- constituency-level map layer.
CREATE TABLE IF NOT EXISTS raw.constituencies (
  const_name_2012   text,
  const_code_2012    integer,
  county             text
);
