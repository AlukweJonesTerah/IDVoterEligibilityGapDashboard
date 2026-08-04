-- One-shot refresh used by the ten-minute cron job.
-- psql variables and conditionals keep a clean run extremely cheap.

SELECT pg_try_advisory_lock(hashtext('icta-dashboard-summary-refresh')) AS refresh_lock_acquired \gset

\if :refresh_lock_acquired
  SELECT source_version AS target_version,
         (
           source_version <> refreshed_version
           AND dirty_at <= clock_timestamp() - interval '30 seconds'
         ) AS refresh_needed
  FROM app.dashboard_refresh_state
  WHERE singleton = true
  \gset

  \if :refresh_needed
    \echo 'ICTA dashboard data changed. Refreshing materialized summaries through source version' :target_version

    UPDATE app.dashboard_refresh_state
    SET refresh_started_at = clock_timestamp()
    WHERE singleton = true;

    \i /dashboard-sql/004_refresh_dashboard_optimization_views.sql

    UPDATE app.dashboard_refresh_state
    SET refreshed_version = GREATEST(refreshed_version, :target_version),
        refreshed_at = clock_timestamp(),
        last_refresh_duration_ms = round(
          extract(epoch FROM (clock_timestamp() - refresh_started_at)) * 1000
        )::integer
    WHERE singleton = true;

    SELECT source_version,
           refreshed_version,
           source_version <> refreshed_version AS refresh_still_needed,
           refreshed_at,
           last_refresh_duration_ms,
           (SELECT count(*)::bigint FROM analytics."20_million_by_2032") AS source_rows,
           (SELECT enrolments::bigint FROM analytics.dashboard_overview_summary_mv) AS summary_rows
    FROM app.dashboard_refresh_state
    WHERE singleton = true;
  \else
    \echo 'ICTA dashboard summaries are current. No refresh needed.'
  \endif

  SELECT pg_advisory_unlock(hashtext('icta-dashboard-summary-refresh'));
\else
  \echo 'Another ICTA dashboard refresh is already running. Exiting.'
\endif
