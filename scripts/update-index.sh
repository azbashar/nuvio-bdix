#!/usr/bin/env bash
#
# Regenerates movies_index.json and (optionally) commits + pushes it.
#
# Usage:
#   ./scripts/update-index.sh             # rebuild, commit, push to origin/main
#   ./scripts/update-index.sh --no-push   # rebuild + commit only
#
# Env:
#   BDIX_CONCURRENCY=8   number of parallel directory requests

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$REPO_ROOT"

PUSH=1

usage() {
    cat <<'EOF'
Regenerates movies_index.json and (optionally) commits + pushes it.

Usage:
  ./scripts/update-index.sh             # rebuild, commit, push to origin/main
  ./scripts/update-index.sh --no-push   # rebuild + commit only

Env:
  BDIX_CONCURRENCY=8   number of parallel directory requests
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

if [ -z "$(git status --porcelain -- movies_index.json)" ]; then
    echo "==> movies_index.json is unchanged; nothing to commit."
    exit 0
fi

COUNT="$(node -e "process.stdout.write(String(require('./movies_index.json').count))")"

echo "==> Committing movies_index.json (${COUNT} movies)"
git add movies_index.json
git commit -m "Update movie index (${COUNT} movies)"

if [ "$PUSH" -eq 1 ]; then
    echo "==> Pushing to origin/main (your SSH key passphrase may be requested)"
    git push origin main
else
    echo "==> Skipped push (--no-push). Run 'git push origin main' when ready."
fi

echo "==> Done."
