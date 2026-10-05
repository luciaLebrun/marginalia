#!/usr/bin/env bash
# Roll the VM to a prebuilt GHCR image tag (MRG-081). Run from the compose dir:
#   deploy/deploy.sh [tag]      # default: develop
# Migrate runs first, on its own: `up` alone recreates the app before migrate
# finishes, so a failing migrate took the site down (v1.8.0). Run first,
# set -e stops here and the old app keeps serving.
set -euo pipefail

tag="${1:-develop}"
export APP_IMAGE="ghcr.io/lucialebrun/marginalia:${tag}"
export TOOLS_IMAGE="ghcr.io/lucialebrun/marginalia-tools:${tag}"

dc() { docker compose --env-file .env.selfhost --profile tunnel "$@"; }

dc pull
dc run --rm migrate
dc up -d --no-build --remove-orphans

# Any HTTP answer counts: the app is up, whatever the route returns.
for _ in $(seq 1 30); do
  if curl -s -o /dev/null http://127.0.0.1:3000/; then
    docker image prune -f
    echo "deployed ${tag}"
    exit 0
  fi
  sleep 2
done

echo "deploy FAILED: app not answering on 127.0.0.1:3000 after 60s (tag ${tag})" >&2
dc ps >&2
exit 1
