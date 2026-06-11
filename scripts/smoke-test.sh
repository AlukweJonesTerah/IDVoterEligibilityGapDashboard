#!/usr/bin/env bash
# Smoke test every dashboard API route. Usage: scripts/smoke-test.sh [base-url]
set -u
BASE="${1:-http://127.0.0.1:3002}"
fail=0
for ep in overview geography "geography?county=Nakuru" demographics pipeline courses quality health; do
  if curl -sf --max-time 30 "$BASE/api/$ep" > /dev/null; then
    echo "ok      /api/$ep"
  else
    echo "FAILED  /api/$ep"
    fail=1
  fi
done
exit $fail
