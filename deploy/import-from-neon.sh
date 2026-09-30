#!/usr/bin/env bash
# One-time data copy for the MRG-081 cut-over (and its rehearsals): dump the
# source Postgres (Neon) and restore it over the compose `db`. Run from the
# compose directory on the VM (/opt/marginalia).
#
# Usage: deploy/import-from-neon.sh [--forget-url] [url-file]
#   url-file   file holding the source connection string, chmod 600
#              (default /opt/marginalia/.neon-url). Never passed via argv/env.
#   --forget-url  delete the url file when done.
#
# Neon is only read (pg_dump), never written: it stays untouched and is the
# rollback. The local db is backed up first (deploy/backup.sh), so the import
# itself is reversible with deploy/restore.sh. Only `app` is stopped; `db` stays up.
#
# The dump covers every schema (no -n filter), so drizzle's
# `drizzle.__drizzle_migrations` (drizzle-orm's default migrationsSchema
# "drizzle", table "__drizzle_migrations") comes across too, and the next
# `migrate` job sees the source's migration history instead of replaying it.
#
# Rehearsal only: DUMP_NETWORK=<docker network> lets the throwaway dump
# container reach a db that is not published (e.g. the local compose network).
set -euo pipefail

ENV_FILE=${COMPOSE_ENV_FILE:-.env.selfhost}
forget=0
if [ "${1:-}" = "--forget-url" ]; then forget=1; shift; fi
file=${1:-/opt/marginalia/.neon-url}

[ -f "$file" ] || { echo "no such url file: $file" >&2; exit 1; }
perm=$(stat -c %a "$file" 2>/dev/null || stat -f %Lp "$file")
[ "$perm" = 600 ] || { echo "refusing: $file must be chmod 600 (is $perm)" >&2; exit 1; }
url=$(tr -d '\r\n' < "$file")
[ -n "$url" ] || { echo "empty url file: $file" >&2; exit 1; }

dc() { docker compose --env-file "$ENV_FILE" "$@"; }
dump=$(mktemp "${TMPDIR:-/tmp}/import-XXXXXX")
trap 'rm -f "$dump"' EXIT

echo "== backup of the current local db"
deploy/backup.sh

echo "== stopping app (db stays up)"
dc stop app

echo "== dumping source (read-only)"
# The url rides in the environment of the docker CLI (--env NAME, no value),
# so it never shows in `ps`.
net=()
[ -z "${DUMP_NETWORK:-}" ] || net=(--network "$DUMP_NETWORK")
SRC_URL=$url docker run --rm --env SRC_URL ${net[@]+"${net[@]}"} \
  mirror.gcr.io/library/postgres:17-alpine \
  sh -c 'pg_dump -Fc --no-owner --no-privileges "$SRC_URL"' > "$dump"
[ -s "$dump" ] || { echo "import failed: empty dump" >&2; exit 1; }

echo "== restoring into local db"
deploy/restore.sh --yes "$dump"

echo "== row counts (compare with the source)"
dc exec -T db psql -U marginalia -d marginalia -At -c "
  select 'user', count(*) from \"user\"
  union all select 'book', count(*) from book
  union all select 'log', count(*) from log
  union all select 'favourite', count(*) from favourite
  union all select 'to_read', count(*) from to_read
  union all select 'invite_code', count(*) from invite_code
  union all select 'drizzle migrations', count(*) from drizzle.__drizzle_migrations"

echo "== starting app"
dc start app
for _ in $(seq 1 30); do
  if curl -s -o /dev/null http://127.0.0.1:3000/; then
    [ "$forget" != 1 ] || rm -f "$file"
    echo "import ok"
    exit 0
  fi
  sleep 2
done
echo "import done but app not answering on 127.0.0.1:3000 after 60s" >&2
dc ps >&2
exit 1
