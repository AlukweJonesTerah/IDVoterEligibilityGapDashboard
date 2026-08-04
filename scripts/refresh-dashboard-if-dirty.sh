#!/bin/sh
set -eu

PATH=/usr/local/bin:/usr/bin:/bin
export PATH

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
LOCK_FILE=/var/tmp/icta-dashboard-refresh.lock

if [ "${ICTA_REFRESH_LOCKED:-0}" != "1" ]; then
  exec env ICTA_REFRESH_LOCKED=1 flock -n "$LOCK_FILE" "$0" "$@"
fi

cd "$REPO_DIR"

docker compose exec -T postgres sh -c \
  'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < db/live/006_refresh_dashboard_if_dirty.sql
