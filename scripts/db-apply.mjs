// Idempotent schema apply for EXISTING databases.
//
// docker-entrypoint-initdb.d only runs on a fresh Postgres volume, so any
// database created before db/init changed never picks up new files. This
// script applies the same files safely (they are all IF NOT EXISTS/CREATE
// OR REPLACE) against an already-initialized database.
//
// Usage: DATABASE_URL=postgres://... node scripts/db-apply.mjs

import { readFileSync } from "fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();
const dbInfo = await client.query("SELECT current_database() AS db, current_user AS usr");
console.log(`Applying to database "${dbInfo.rows[0].db}" as "${dbInfo.rows[0].usr}"`);

const files = [
  "db/init/001_init.sql",
  "db/init/003_ref_counties.sql",
  "db/init/006_ref_county_lookup.sql",
  "db/init/010_raw_census_population.sql",
  "db/init/011_raw_id_eligibility.sql",
  "db/init/012_raw_admin_dimensions.sql",
  "db/init/013_raw_population_housing_2019.sql",
  "db/init/014_raw_census2009_volume1b.sql",
  "db/init/020_ref_geo_views.sql",
  "db/init/030_staging_reconciliation.sql",
  "db/init/040_analytics_eligibility_views.sql",
  "db/init/041_analytics_population_housing_views.sql",
  "db/init/042_analytics_census2009_volume1b_views.sql"
];

for (const f of files) {
  process.stdout.write(`  ${f} ... `);
  await client.query(readFileSync(f, "utf8"));
  console.log("ok");
}

console.log("Schema applied. Run `npm run db:seed` to (re)load the eligibility dataset.");
await client.end();
