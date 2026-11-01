#!/usr/bin/env bash
#
# Regenerates movies_index.json and series_index.json, then (optionally)
# commits + pushes them.
#
# Usage:
#   ./scripts/update-index.sh             # rebuild, commit, push to origin/main
#   ./scripts/update-index.sh --no-push   # rebuild + commit only
#
# Env:
#   BDIX_CONCURRENCY=8   number of parallel directory requests
#   BDIX_ALLOW_PARTIAL=1 allow smaller indexes when a server is down

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

PUSH=1

usage() {
    cat <<'EOF'
Regenerates movies_index.json and series_index.json, then (optionally)
commits + pushes them.

Usage:
  ./scripts/update-index.sh             # rebuild, commit, push to origin/main
  ./scripts/update-index.sh --no-push   # rebuild + commit only

Env:
  BDIX_CONCURRENCY=8   number of parallel directory requests
  BDIX_ALLOW_PARTIAL=1 allow smaller indexes when a server is down
EOF
}

for arg in "$@"; do
    case "$arg" in
        --no-push)
            PUSH=0
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $arg" >&2
            usage >&2
            exit 1
            ;;
    esac
done

command -v node >/dev/null 2>&1 || {
    echo "Error: node is not installed or not on PATH." >&2
    exit 1
}

git rev-parse --is-inside-work-tree >/dev/null 2>&1 || {
    echo "Error: $REPO_ROOT is not a git repository." >&2
    exit 1
}

echo "==> Crawling BDIX servers and generating movies_index.json"
node scripts/generate-movies-index.mjs

echo "==> Crawling BDIX servers and generating series_index.json"
node scripts/generate-series-index.mjs

if [ -z "$(git status --porcelain -- movies_index.json series_index.json)" ]; then
    echo "==> Indexes are unchanged; nothing to commit."
    exit 0
fi

MOVIE_COUNT="$(node -e "process.stdout.write(String(require('./movies_index.json').count))")"
SERIES_COUNT="$(node -e "process.stdout.write(String(require('./series_index.json').counts.shows))")"

echo "==> Rebuilding providers with updated indexes"
node build.js

echo "==> Committing indexes and providers (${MOVIE_COUNT} movies, ${SERIES_COUNT} shows)"
git add movies_index.json series_index.json providers/iccftp-movies.js providers/iccftp-series.js
git commit -m "Update indexes and bundled providers (${MOVIE_COUNT} movies, ${SERIES_COUNT} shows)"

if [ "$PUSH" -eq 1 ]; then
    echo "==> Pushing to origin/main (your SSH key passphrase may be requested)"
    git push origin main
else
    echo "==> Skipped push (--no-push). Run 'git push origin main' when ready."
fi

echo "==> Done."
