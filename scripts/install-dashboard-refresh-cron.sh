#!/bin/sh
set -eu

PATH=/usr/local/bin:/usr/bin:/bin
export PATH

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
MARKER="# ICTA dashboard automatic materialized-view refresh"
CRON_ENTRY="*/10 * * * * $REPO_DIR/scripts/refresh-dashboard-if-dirty.sh 2>&1 | logger -t icta-dashboard-refresh"
CRON_FILE=$(mktemp)

cleanup() {
  rm -f "$CRON_FILE"
}
trap cleanup EXIT INT TERM

cd "$REPO_DIR"

docker compose exec -T postgres sh -c \
  'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
  < db/live/005_dashboard_refresh_state.sql

crontab -l 2>/dev/null \
  | awk -v marker="$MARKER" '
      skip { skip = 0; next }
      $0 == marker { skip = 1; next }
      { print }
    ' > "$CRON_FILE" || true

printf '%s\n%s\n' "$MARKER" "$CRON_ENTRY" >> "$CRON_FILE"
crontab "$CRON_FILE"

echo "Installed ICTA dashboard refresh cron:"
echo "$CRON_ENTRY"
