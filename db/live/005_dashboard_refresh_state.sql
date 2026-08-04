-- Lightweight change tracking for automatic dashboard-summary refreshes.
-- The trigger only marks the source as dirty. A cron job performs the
-- materialized-view refresh after the data-loading transaction commits.

CREATE TABLE IF NOT EXISTS app.dashboard_refresh_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  source_version bigint NOT NULL DEFAULT 0,
  refreshed_version bigint NOT NULL DEFAULT 0,
  dirty_at timestamptz,
  refresh_started_at timestamptz,
  refreshed_at timestamptz,
  last_refresh_duration_ms integer
);

INSERT INTO app.dashboard_refresh_state (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE OR REPLACE FUNCTION app.mark_dashboard_summaries_dirty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, app
AS $$
BEGIN
  UPDATE app.dashboard_refresh_state
  SET source_version = source_version + 1,
      dirty_at = clock_timestamp()
  WHERE singleton = true;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mark_dashboard_summaries_dirty
ON analytics."20_million_by_2032";

CREATE TRIGGER mark_dashboard_summaries_dirty
AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE
ON analytics."20_million_by_2032"
FOR EACH STATEMENT
EXECUTE FUNCTION app.mark_dashboard_summaries_dirty();

COMMENT ON TABLE app.dashboard_refresh_state IS
  'Tracks source changes and the last materialized-view refresh consumed by the dashboard cache.';
