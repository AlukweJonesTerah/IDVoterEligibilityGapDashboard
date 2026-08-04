// Refresh the dashboard materialized summaries after the data team reloads
// analytics."20_million_by_2032".
//
// Routine refresh:
//   bun run db:refresh
//
// Rebuild definitions after this repository changes the summary SQL:
//   bun run db:views

import { readFileSync } from "fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const rebuild = process.argv.includes("--rebuild");
const checkOnly = process.argv.includes("--check");
const sqlFile = rebuild
  ? "db/live/003_dashboard_optimization_views.sql"
  : "db/live/004_refresh_dashboard_optimization_views.sql";
const client = new pg.Client({ connectionString: url });

async function state() {
  const raw = await client.query(`
    SELECT count(*)::int AS rows,
           count(DISTINCT source)::int AS sources,
           max(date_trained)::text AS latest_training_date
    FROM analytics."20_million_by_2032"`);
  const summaryExists = (await client.query(
    "SELECT to_regclass('analytics.dashboard_overview_summary_mv') IS NOT NULL AS ok"
  )).rows[0].ok;
  const summary = summaryExists
    ? (await client.query(`
        SELECT enrolments::int AS rows, sources::int AS sources,
               last_date AS latest_training_date
        FROM analytics.dashboard_overview_summary_mv`)).rows[0]
    : null;
  return { raw: raw.rows[0], summary };
}

try {
  await client.connect();
  const dbInfo = (await client.query("SELECT current_database() AS db, current_user AS usr")).rows[0];
  const sourceExists = (await client.query(
    "SELECT to_regclass('analytics.\"20_million_by_2032\"') IS NOT NULL AS ok"
  )).rows[0].ok;
  if (!sourceExists) throw new Error('analytics."20_million_by_2032" does not exist');

  if (checkOnly) {
    console.log(`Dashboard refresh state for database "${dbInfo.db}" as "${dbInfo.usr}"`);
    console.log(await state());
    process.exitCode = 0;
  } else {
  console.log(`Refreshing database "${dbInfo.db}" as "${dbInfo.usr}" using ${sqlFile}`);
  console.log("Before:", await state());
  await client.query(readFileSync(sqlFile, "utf8"));
  console.log("After:", await state());
  console.log(rebuild ? "Dashboard summary definitions rebuilt." : "Dashboard summaries refreshed.");
  }
} finally {
  await client.end().catch(() => undefined);
}
