// Loads the Kenya ID/voter-eligibility dataset (extracted from the source
// Power BI report) into Postgres. Idempotent: truncates and reloads each
// table, so it's safe to rerun after a schema change or a fresh data drop.
//
// Usage: node --env-file-if-exists=.env scripts/seed-eligibility-data.mjs

import { readFileSync } from "fs";
import { parse } from "csv-parse/sync";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const SEED_DIR = "db/seed-data";
const BATCH = 2000;

// table -> [csv file, [column names in file order]]
const TABLES = [
  ["raw.census2019_age_sex_county_subcounty", "census2019_age_sex_county_subcounty.csv"],
  ["raw.census2009_age_sex_province_district", "census2009_age_sex_province_district.csv"],
  ["raw.id_holders_by_location", "id_holders_by_location.csv"],
  ["raw.population_by_county_2019", "population_by_county_2019.csv"],
  ["raw.population_by_subcounty_2019", "population_by_subcounty_2019.csv"],
  ["raw.population_unpivot", "population_unpivot.csv"],
  ["raw.id_eligibility", "id_eligibility.csv"],
  ["raw.registered_voters_county", "registered_voters_county.csv"],
  ["raw.dim_county", "dim_county.csv"],
  ["raw.dim_subcounty", "dim_subcounty.csv"],
  ["raw.kenya_county_codes", "kenya_county_codes.csv"],
  ["raw.subcounty_codes", "subcounty_codes.csv"],
  ["raw.district_county_mapping", "district_county_mapping.csv"],
  ["raw.constituencies", "constituencies.csv"],
  ["raw.population_housing_county_2019", "population_housing_county_2019.csv"],
  ["raw.population_housing_subcounty_2019", "population_housing_subcounty_2019.csv"],
  ["raw.population_housing_subloc_2019", "population_housing_subloc_2019.csv"],
  ["raw.urban_centers_2019", "urban_centers_2019.csv"],
  ["raw.population_housing_county_2009", "population_housing_county_2009.csv"],
  ["raw.population_housing_constituency_2009", "population_housing_constituency_2009.csv"],
  ["raw.census2009_age_sex_county", "census2009_age_sex_county.csv"]
];

function toCell(v) {
  if (v === undefined || v === null || v === "") return null;
  return v;
}

async function loadTable(client, table, file) {
  const csvPath = `${SEED_DIR}/${file}`;
  const raw = readFileSync(csvPath, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true });
  if (rows.length === 0) {
    console.log(`  ${table} <- ${file}: 0 rows, skipped`);
    return;
  }
  const columns = Object.keys(rows[0]);

  await client.query(`TRUNCATE ${table}`);

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const values = [];
    const params = [];
    chunk.forEach((row, j) => {
      const base = j * columns.length;
      values.push(`(${columns.map((_, k) => `$${base + k + 1}`).join(",")})`);
      columns.forEach((c) => params.push(toCell(row[c])));
    });
    await client.query(
      `INSERT INTO ${table} (${columns.join(",")}) VALUES ${values.join(",")}`,
      params
    );
  }
  console.log(`  ${table} <- ${file}: ${rows.length} rows`);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const dbInfo = (await client.query("SELECT current_database() AS db, current_user AS usr")).rows[0];
console.log(`Seeding eligibility dataset into "${dbInfo.db}" as "${dbInfo.usr}"`);

for (const [table, file] of TABLES) {
  await loadTable(client, table, file);
}

console.log("Done.");
await client.end();
