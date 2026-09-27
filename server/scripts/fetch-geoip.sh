#!/bin/sh
# Downloads the free DB-IP Lite country + ASN databases (CC-BY 4.0,
# https://db-ip.com) into the given directory, for IpLookupService (ADR 0019).
# DB-IP publishes one file per month; early in a month the new one may not be
# out yet, so this falls back to the previous month. Never fails the build:
# a missing database only means Page Views are stored without that field.
#
#   sh server/scripts/fetch-geoip.sh server/geoip   # local dev
set -u
dir="${1:-geoip}"
mkdir -p "$dir"

year=$(date -u +%Y)
month=$(date -u +%m)
this_month="$year-$month"
month=${month#0}
if [ "$month" -eq 1 ]; then prev_month="$((year - 1))-12"; else prev_month=$(printf '%s-%02d' "$year" $((month - 1))); fi

for db in country asn; do
  ok=0
  for ym in "$this_month" "$prev_month"; do
    if wget -q -O "$dir/dbip-$db-lite.mmdb.gz" "https://download.db-ip.com/free/dbip-$db-lite-$ym.mmdb.gz" \
      && gunzip -f "$dir/dbip-$db-lite.mmdb.gz"; then
      echo "fetch-geoip: dbip-$db-lite $ym"
      ok=1
      break
    fi
  done
  if [ "$ok" -eq 0 ]; then
    rm -f "$dir/dbip-$db-lite.mmdb.gz"
    echo "fetch-geoip: could not download dbip-$db-lite — continuing without it" >&2
  fi
done
exit 0
