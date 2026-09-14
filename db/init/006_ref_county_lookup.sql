-- Single join target combining canonical county names and known aliases
-- (ref.county_aliases), so every downstream view resolves a messy source
-- county string in one join instead of repeating the alias fallback logic.
CREATE OR REPLACE VIEW ref.county_lookup AS
SELECT ref.norm_county(county_name) AS county_norm, county_code FROM ref.counties
UNION
SELECT ref.norm_county(alias), county_code FROM ref.county_aliases;
