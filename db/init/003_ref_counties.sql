-- Kenya county reference list: official codes 1-47, former-province grouping,
-- and KNBS 2019 Census population (Volume I). Population anchors per-capita
-- metrics and population-weighted sample allocation; always real, never sampled.

-- Canonical county-name matching: source systems vary in casing, hyphens and
-- apostrophes ("Tharaka Nithi" / "THARAKA-NITHI" / "Murang'a"). Join through
-- this normalizer instead of comparing raw text.
CREATE OR REPLACE FUNCTION ref.norm_county(text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT regexp_replace(upper($1), '[^A-Z]', '', 'g')
$$;

CREATE TABLE IF NOT EXISTS ref.counties (
  county_code   smallint PRIMARY KEY,
  county_name   text NOT NULL UNIQUE,
  former_province text NOT NULL,
  population_2019 integer NOT NULL
);

INSERT INTO ref.counties (county_code, county_name, former_province, population_2019) VALUES
  (1,  'Mombasa',          'Coast',         1208333),
  (2,  'Kwale',            'Coast',          866820),
  (3,  'Kilifi',           'Coast',         1453787),
  (4,  'Tana River',       'Coast',          315943),
  (5,  'Lamu',             'Coast',          143920),
  (6,  'Taita-Taveta',     'Coast',          340671),
  (7,  'Garissa',          'North Eastern',  841353),
  (8,  'Wajir',            'North Eastern',  781263),
  (9,  'Mandera',          'North Eastern',  867457),
  (10, 'Marsabit',         'Eastern',        459785),
  (11, 'Isiolo',           'Eastern',        268002),
  (12, 'Meru',             'Eastern',       1545714),
  (13, 'Tharaka-Nithi',    'Eastern',        393177),
  (14, 'Embu',             'Eastern',        608599),
  (15, 'Kitui',            'Eastern',       1136187),
  (16, 'Machakos',         'Eastern',       1421932),
  (17, 'Makueni',          'Eastern',        987653),
  (18, 'Nyandarua',        'Central',        638289),
  (19, 'Nyeri',            'Central',        759164),
  (20, 'Kirinyaga',        'Central',        610411),
  (21, 'Murang''a',        'Central',       1056640),
  (22, 'Kiambu',           'Central',       2417735),
  (23, 'Turkana',          'Rift Valley',    926976),
  (24, 'West Pokot',       'Rift Valley',    621241),
  (25, 'Samburu',          'Rift Valley',    310327),
  (26, 'Trans Nzoia',      'Rift Valley',    990341),
  (27, 'Uasin Gishu',      'Rift Valley',   1163186),
  (28, 'Elgeyo-Marakwet',  'Rift Valley',    454480),
  (29, 'Nandi',            'Rift Valley',    885711),
  (30, 'Baringo',          'Rift Valley',    666763),
  (31, 'Laikipia',         'Rift Valley',    518560),
  (32, 'Nakuru',           'Rift Valley',   2162202),
  (33, 'Narok',            'Rift Valley',   1157873),
  (34, 'Kajiado',          'Rift Valley',   1117840),
  (35, 'Kericho',          'Rift Valley',    901777),
  (36, 'Bomet',            'Rift Valley',    875689),
  (37, 'Kakamega',         'Western',       1867579),
  (38, 'Vihiga',           'Western',        590013),
  (39, 'Bungoma',          'Western',       1670570),
  (40, 'Busia',            'Western',        893681),
  (41, 'Siaya',            'Nyanza',         993183),
  (42, 'Kisumu',           'Nyanza',        1155574),
  (43, 'Homa Bay',         'Nyanza',        1131950),
  (44, 'Migori',           'Nyanza',        1116436),
  (45, 'Kisii',            'Nyanza',        1266860),
  (46, 'Nyamira',          'Nyanza',         605576),
  (47, 'Nairobi',          'Nairobi',       4397073)
ON CONFLICT (county_code) DO NOTHING;

-- Name variants seen in source data map here so county joins stay clean.
CREATE TABLE IF NOT EXISTS ref.county_aliases (
  alias text PRIMARY KEY,
  county_code smallint NOT NULL REFERENCES ref.counties(county_code)
);

INSERT INTO ref.county_aliases (alias, county_code) VALUES
  ('TAITA TAVETA', 6),
  ('THARAKA NITHI', 13),
  ('MURANGA', 21),
  ('MURANG''A', 21),
  ('ELGEYO MARAKWET', 28),
  ('ELGEYO/MARAKWET', 28),
  ('HOMABAY', 43),
  ('NAIROBI CITY', 47),
  ('UASINGISHU', 27)
ON CONFLICT (alias) DO NOTHING;
