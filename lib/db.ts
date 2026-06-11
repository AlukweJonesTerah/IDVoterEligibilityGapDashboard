import { Pool } from "pg";

const globalForDb = globalThis as unknown as { pgPool?: Pool };

export const db =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = db;
