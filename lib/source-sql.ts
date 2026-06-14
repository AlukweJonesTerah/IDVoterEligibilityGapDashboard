export const PROGRAMME_TABLE = `analytics."20_million_by_2032"`;
export const PROGRAMME_DATASET_KEY = "programme_participants";

const KENYA_COUNTIES = [
  "Mombasa",
  "Kwale",
  "Kilifi",
  "Tana River",
  "Lamu",
  "Taita-Taveta",
  "Garissa",
  "Wajir",
  "Mandera",
  "Marsabit",
  "Isiolo",
  "Meru",
  "Tharaka-Nithi",
  "Embu",
  "Kitui",
  "Machakos",
  "Makueni",
  "Nyandarua",
  "Nyeri",
  "Kirinyaga",
  "Murang'a",
  "Kiambu",
  "Turkana",
  "West Pokot",
  "Samburu",
  "Trans Nzoia",
  "Uasin Gishu",
  "Elgeyo-Marakwet",
  "Nandi",
  "Baringo",
  "Laikipia",
  "Nakuru",
  "Narok",
  "Kajiado",
  "Kericho",
  "Bomet",
  "Kakamega",
  "Vihiga",
  "Bungoma",
  "Busia",
  "Siaya",
  "Kisumu",
  "Homa Bay",
  "Migori",
  "Kisii",
  "Nyamira",
  "Nairobi"
];

export function personKeySql(alias: string) {
  return `coalesce(
    nullif(trim(${alias}.national_id), ''),
    nullif(regexp_replace(coalesce(${alias}.phone_number, ''), '[^0-9]+', '', 'g'), ''),
    nullif(lower(trim(${alias}.email)), ''),
    nullif(trim(${alias}.survey_uuid), ''),
    nullif(trim(${alias}.record_id), '')
  )`;
}

export function normSql(expr: string) {
  return `regexp_replace(lower(coalesce(${expr}, '')), '[^a-z0-9]+', '', 'g')`;
}

export function countyLabelSql(expr: string) {
  return `CASE
    WHEN ${normSql(expr)} = 'elgeyomarakwet' THEN 'Elgeyo-Marakwet'
    WHEN ${normSql(expr)} = 'taitataveta' THEN 'Taita-Taveta'
    WHEN ${normSql(expr)} = 'tharakanithi' THEN 'Tharaka-Nithi'
    WHEN ${normSql(expr)} = 'muranga' THEN 'Murang''a'
    ELSE initcap(trim(${expr}))
  END`;
}

export function kenyaCountyValuesSql(alias = "kc") {
  const values = KENYA_COUNTIES.map((county) => {
    const countyNorm = county.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return `('${countyNorm}', '${county.replace(/'/g, "''")}')`;
  }).join(", ");
  return `(VALUES ${values}) AS ${alias}(county_norm, county_name)`;
}

export function ageBandSql(expr: string) {
  const n = normSql(expr);
  return `CASE
    WHEN ${expr} IS NULL OR trim(${expr}) = '' THEN NULL
    WHEN ${n} LIKE '18%' THEN '18-24'
    WHEN ${n} LIKE '25%' OR ${n} LIKE '26%' OR ${n} LIKE '27%' OR ${n} LIKE '28%' OR ${n} LIKE '29%' OR ${n} LIKE '30%' THEN '25-34'
    WHEN ${n} LIKE '35%' OR ${n} LIKE '36%' OR ${n} LIKE 'above35%' THEN '35+'
    WHEN ${n} LIKE '45%' OR ${n} LIKE '46%' THEN '45-54'
    WHEN ${n} LIKE '55%' OR ${n} LIKE '65%' OR ${n} LIKE '66%' OR ${n} LIKE '70%' THEN '55+'
    ELSE trim(${expr})
  END`;
}

export function nonBlankSql(expr: string) {
  return `${expr} IS NOT NULL AND trim(${expr}) <> ''`;
}

export function hasDeviceSql(alias: string) {
  return `(
    lower(trim(coalesce(${alias}.has_device, ''))) IN ('yes', 'y', 'true', '1')
    OR ${nonBlankSql(`${alias}.device_used`)}
    OR ${nonBlankSql(`${alias}.device_type`)}
  )`;
}
