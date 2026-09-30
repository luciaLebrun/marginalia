#!/usr/bin/env bash
# Restore a dump made by backup.sh into the compose `db` service
# (pg_restore --clean --if-exists --no-owner). Run from the compose directory.
# Usage: deploy/restore.sh [--yes] <dump>
set -euo pipefail

ENV_FILE=${COMPOSE_ENV_FILE:-.env.selfhost}
yes=0
if [ "${1:-}" = "--yes" ]; then yes=1; shift; fi
dump=${1:?usage: restore.sh [--yes] <dump>}
[ -f "$dump" ] || { echo "no such file: $dump" >&2; exit 1; }

if [ "$yes" != 1 ]; then
  printf 'Overwrite the marginalia database with %s? [y/N] ' "$dump"
  read -r ans
  case "$ans" in y|Y) ;; *) echo "aborted"; exit 1 ;; esac
fi

docker compose --env-file "$ENV_FILE" exec -T db \
  pg_restore -U marginalia -d marginalia --clean --if-exists --no-owner --exit-on-error < "$dump"
echo "restore ok: $dump"
