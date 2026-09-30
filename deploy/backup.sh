#!/usr/bin/env bash
# Nightly Postgres backup for the self-hosted stack: pg_dump -Fc of the
# `marginalia` database from the compose `db` service, written atomically to
# $BACKUP_DIR, keeping the newest $KEEP dumps. Run from the compose directory.
#
# Cron, nightly at 03:15:
#   15 3 * * * cd /opt/marginalia && deploy/backup.sh >> /var/log/marginalia-backup.log 2>&1
#
# If BACKUP_BUCKET is set (e.g. marginalia-508219-backups), each dump is also
# uploaded there using the VM's service account (objectCreator only; the bucket
# lifecycle expires objects after 30 days). Upload failure fails the run.
# curl, not `gcloud storage cp`: gcloud needs storage.objects.get, which
# objectCreator lacks.
set -euo pipefail

ENV_FILE=${COMPOSE_ENV_FILE:-.env.selfhost}
DIR=${BACKUP_DIR:-/var/backups/marginalia}
KEEP=${KEEP:-14}

mkdir -p "$DIR"
out="$DIR/marginalia-$(date -u +%Y%m%dT%H%M%SZ).dump"
tmp="$out.partial"
trap 'rm -f "$tmp"' EXIT

docker compose --env-file "$ENV_FILE" exec -T db pg_dump -U marginalia -Fc marginalia > "$tmp"
[ -s "$tmp" ] || { echo "backup failed: empty dump" >&2; exit 1; }
mv "$tmp" "$out"

if [ -n "${BACKUP_BUCKET:-}" ]; then
  token=$(curl -sf -H 'Metadata-Flavor: Google' \
    http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token |
    sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
  [ -n "$token" ] || { echo "backup failed: no access token" >&2; exit 1; }
  curl -sf -o /dev/null -X POST -H "Authorization: Bearer $token" -T "$out" \
    "https://storage.googleapis.com/upload/storage/v1/b/$BACKUP_BUCKET/o?uploadType=media&name=$(basename "$out")" \
    || { echo "backup failed: upload to $BACKUP_BUCKET" >&2; exit 1; }
fi

# retention: newest $KEEP survive (timestamped names sort chronologically)
ls -1 "$DIR"/marginalia-*.dump | sort -r | tail -n +$((KEEP + 1)) | while read -r f; do rm -f "$f"; done

echo "backup ok: $out ($(wc -c < "$out" | tr -d ' ') bytes)"
