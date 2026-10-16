#!/usr/bin/env sh
set -eu

TARGET_URL="${1:-http://beaconops.local/api/incidents}"
REQUESTS="${REQUESTS:-5000}"
CONCURRENCY="${CONCURRENCY:-30}"

if command -v hey >/dev/null 2>&1; then
  exec hey -n "$REQUESTS" -c "$CONCURRENCY" "$TARGET_URL"
fi

echo "Install 'hey' for controlled concurrency; using curl fallback."
i=0
while [ "$i" -lt "$REQUESTS" ]; do
  curl --fail --silent --output /dev/null "$TARGET_URL"
  i=$((i + 1))
done
