import { NextRequest, NextResponse } from "next/server";

type CacheEntry = {
  expiresAt: number;
  data: unknown;
};

const globalForCache = globalThis as unknown as { ictaApiCache?: Map<string, CacheEntry> };
const cache = globalForCache.ictaApiCache ?? new Map<string, CacheEntry>();
globalForCache.ictaApiCache = cache;

const DEFAULT_TTL_MS = Number(process.env.ICTA_API_CACHE_TTL_MS ?? 10 * 60_000);

// This dataset (Kenya census/ID-eligibility data) is loaded once and never
// mutated at runtime, unlike the old training dashboard's live, growing
// source table -- so there's no need for the refresh-trigger cache
// invalidation that used to live here. Just a plain TTL cache.
export async function cachedJson<T>(
  req: NextRequest,
  namespace: string,
  load: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
) {
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
