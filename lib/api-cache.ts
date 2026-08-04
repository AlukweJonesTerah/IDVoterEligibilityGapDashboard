import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

type RefreshVersionState = {
  checkedAt: number;
  version: string | null;
  pending: Promise<void> | null;
};

const globalForCache = globalThis as unknown as {
  ictaApiCache?: Map<string, CacheEntry>;
  ictaRefreshVersion?: RefreshVersionState;
};
const cache = globalForCache.ictaApiCache ?? new Map<string, CacheEntry>();
globalForCache.ictaApiCache = cache;

const refreshVersion = globalForCache.ictaRefreshVersion ?? {
  checkedAt: 0,
  version: null,
  pending: null
};
globalForCache.ictaRefreshVersion = refreshVersion;

const DEFAULT_TTL_MS = Number(process.env.ICTA_API_CACHE_TTL_MS ?? 10 * 60_000);
const VERSION_CHECK_MS = Number(process.env.ICTA_CACHE_VERSION_CHECK_MS ?? 30_000);

async function invalidateCacheAfterSummaryRefresh() {
  const now = Date.now();
  if (now - refreshVersion.checkedAt < VERSION_CHECK_MS) return;
  if (refreshVersion.pending) return refreshVersion.pending;

  refreshVersion.pending = db
    .query<{ refreshed_version: string }>(`
      SELECT refreshed_version::text
      FROM app.dashboard_refresh_state
      WHERE singleton = true`)
    .then((result) => {
      const nextVersion = result.rows[0]?.refreshed_version ?? null;
      if (refreshVersion.version !== null && nextVersion !== refreshVersion.version) cache.clear();
      refreshVersion.version = nextVersion;
    })
    .catch(() => {
      // Keep the dashboard available during rollout or if the optional refresh
      // state table is temporarily unavailable. The normal TTL still applies.
    })
    .finally(() => {
      refreshVersion.checkedAt = Date.now();
      refreshVersion.pending = null;
    });

  return refreshVersion.pending;
}

export async function cachedJson<T>(
  req: NextRequest,
  namespace: string,
  load: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
) {
  await invalidateCacheAfterSummaryRefresh();

  const key = `${namespace}:${req.nextUrl.searchParams.toString()}`;
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json(hit.data, { headers: { "Cache-Control": "no-store", "X-ICTA-Cache": "HIT" } });
  }

  const data = await load();
  cache.set(key, { data, expiresAt: now + ttlMs });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store", "X-ICTA-Cache": "MISS" } });
}
