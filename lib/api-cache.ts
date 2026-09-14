import { NextRequest, NextResponse } from "next/server";

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const globalForCache = globalThis as unknown as { ictaApiCache?: Map<string, CacheEntry> };
const cache = globalForCache.ictaApiCache ?? new Map<string, CacheEntry>();
globalForCache.ictaApiCache = cache;

// Short by design: the underlying data can now change from outside the app
// (a re-run of scripts/seed-eligibility-data.mjs for a batch data drop, or
// any other writer against the same Postgres/Neon database) and viewers
// should see that within seconds, not the old 10-minute static-dataset
// window. Still real caching -- it just favors freshness over TTL length.
const DEFAULT_TTL_MS = Number(process.env.ICTA_API_CACHE_TTL_MS ?? 15_000);

export async function cachedJson<T>(
  req: NextRequest,
  namespace: string,
  load: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
) {
  const key = `${namespace}:${req.nextUrl.searchParams.toString()}`;
  const now = Date.now();
  const cacheControl = `private, max-age=${Math.max(1, Math.floor(ttlMs / 1000))}`;
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) {
    return NextResponse.json(hit.data, { headers: { "Cache-Control": cacheControl, "X-ICTA-Cache": "HIT" } });
  }

  const data = await load();
  cache.set(key, { data, expiresAt: now + ttlMs });
  return NextResponse.json(data, { headers: { "Cache-Control": cacheControl, "X-ICTA-Cache": "MISS" } });
}
