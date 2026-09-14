-- ID-gap ground truth: eligible-adult population vs. ID-holder counts, at
-- full county/subcounty/division/location granularity.
CREATE TABLE IF NOT EXISTS raw.id_eligibility (
  county_code     integer,
  county_name      text,
  subcounty_code   text,
  subcounty        text,
  division_code    text,
  division         text,
  location_code    text,
  location_name    text,
  attribute        text,
  gender           text,
  value            integer,
  population       integer
);

-- Current registered-voter totals by county (single snapshot, used
-- identically against both the 2019 and 2009 population-projection tracks).
CREATE TABLE IF NOT EXISTS raw.registered_voters_county (
  county_code         integer,
  county_name          text,
  registered_voters    integer
);
