-- Sub-county and constituency dimensions, resolved to a canonical
-- county_code via ref.norm_county(). Views rather than physical tables:
-- this data is static reference data loaded once, so there's no freshness
-- benefit to materializing, and a view can never drift from raw.*.

CREATE OR REPLACE VIEW ref.subcounties AS
SELECT DISTINCT
  d.subcounty AS subcounty_name,
  l.county_code
FROM raw.dim_subcounty d
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(d.county)
WHERE d.subcounty IS NOT NULL AND btrim(d.subcounty) <> '';

CREATE OR REPLACE VIEW ref.constituencies AS
SELECT DISTINCT
  k.const_name_2012,
  k.const_code_2012,
  l.county_code
FROM raw.constituencies k
JOIN ref.county_lookup l ON l.county_norm = ref.norm_county(k.county);
