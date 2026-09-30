#!/usr/bin/env bash
# Nightly Postgres backup for the self-hosted stack: pg_dump -Fc of the
# `marginalia` database from the compose `db` service, written atomically to
# $BACKUP_DIR, keeping the newest $KEEP dumps. Run from the compose directory.
#
# Cron, nightly at 03:15:
#   15 3 * * * cd /opt/marginalia && deploy/backup.sh >> /var/log/marginalia-backup.log 2>&1
#
# Dumps stay on the VM. Copying them off-VM is a separate step, still to decide.
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

# retention: newest $KEEP survive (timestamped names sort chronologically)
ls -1 "$DIR"/marginalia-*.dump | sort -r | tail -n +$((KEEP + 1)) | while read -r f; do rm -f "$f"; done

echo "backup ok: $out ($(wc -c < "$out" | tr -d ' ') bytes)"
