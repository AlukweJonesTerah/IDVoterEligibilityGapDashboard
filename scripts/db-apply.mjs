// Idempotent schema apply for EXISTING databases.
//
// docker-entrypoint-initdb.d only runs on a fresh Postgres volume, so any
// database created before db/init changed never picks them up. This script
// applies the same files safely (they are IF NOT EXISTS / ON CONFLICT) and
// fixes the dataset registry afterwards:
//   - training_records is marked 'actual' when analytics.icta_training_data
//     has rows, so real headline data never shows as modeled.
//
// Usage: DATABASE_URL=postgres://... node scripts/db-apply.mjs [--with-sample]

import { readFileSync } from "fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
const withSample = process.argv.includes("--with-sample");

const client = new pg.Client({ connectionString: url });
await client.connect();
const dbInfo = await client.query("SELECT current_database() AS db, current_user AS usr");
console.log(`Applying to database "${dbInfo.rows[0].db}" as "${dbInfo.rows[0].usr}"`);

const files = [
  "db/init/001_init.sql",
  "db/init/002_ref_sample_registry.sql",
  "db/init/003_ref_counties.sql",
  ...(withSample ? ["db/sample/001_generate_sample_lane.sql"] : [])
];

for (const f of files) {
  process.stdout.write(`  ${f} ... `);
  await client.query(readFileSync(f, "utf8"));
  console.log("ok");
}

const tableExists = (await client.query(
  "SELECT to_regclass('analytics.icta_training_data') IS NOT NULL AS ok"
)).rows[0].ok;
if (tableExists) {
  const fix = await client.query(`
    UPDATE app.dataset_registry
       SET active_source = 'actual',
           loaded_at = coalesce(loaded_at, now()),
           row_count = (SELECT count(*) FROM analytics.icta_training_data)
     WHERE dataset_key = 'training_records'
       AND EXISTS (SELECT 1 FROM analytics.icta_training_data LIMIT 1)
     RETURNING row_count`);
  console.log(
    fix.rowCount
      ? `  training_records marked actual (${fix.rows[0].row_count} rows)`
      : "  training_records left as-is (table is empty)"
  );
} else {
  console.log("  training_records left as-is (analytics.icta_training_data missing)");
}

const reg = await client.query(
  "SELECT dataset_key, active_source FROM app.dataset_registry ORDER BY dataset_key"
);
console.table(reg.rows);
await client.end();
