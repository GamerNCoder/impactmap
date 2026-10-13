#!/usr/bin/env bash
# Build ImpactMap with the dafoware OpenCode Go pipeline (~/bin/student, routing per ~/dafoware-work/MODEL-ROUTING.md).
# Claude/Codex write the brief and review; a Go model writes the code in a throwaway worktree.
#
#   scripts/go.sh BRIEF.md [--check "CMD"] [-m MODEL|auto] [--sparse "PATHS"]
#
# - worktree ../impactmap-go/<brief-name> from HEAD (main checkout is never touched)
# - prepends the repo map (scripts/repomap.mjs) so the student reads the map, not the repo
# - default check: tsc + eslint (+ build); add `npm run test:db` for DB work (needs scripts/clean-db.sh up)
# - prints the verdict and diff stat; merge with: git -C ../impactmap-go/<name> diff HEAD | git apply
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
BRIEF="${1:?usage: scripts/go.sh BRIEF.md [--check CMD] [-m MODEL] [--sparse PATHS]}"; shift
CHECK="npx tsc --noEmit && npx eslint src && npm run build"
MODEL=auto; SPARSE=""
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK="$2"; shift 2 ;;
    -m) MODEL="$2"; shift 2 ;;
    --sparse) SPARSE="$2"; shift 2 ;;
    *) echo "unknown arg $1" >&2; exit 2 ;;
  esac
done

NAME="$(basename "$BRIEF" .md)"
WT="$(dirname "$REPO")/impactmap-go/$NAME"
mkdir -p "$(dirname "$WT")"
if [ ! -d "$WT" ]; then git -C "$REPO" worktree add -q --detach "$WT" HEAD; fi
# Turbopack panics on a node_modules symlink that points outside the root: APFS-clone it (instant, no extra disk)
if [ -L "$WT/node_modules" ]; then rm "$WT/node_modules"; fi
[ -d "$WT/node_modules" ] || cp -cR "$REPO/node_modules" "$WT/node_modules"
if [ -f "$REPO/.env.local" ] && [ ! -e "$WT/.env.local" ]; then cp "$REPO/.env.local" "$WT/.env.local"; fi

FULL="$WT/.go-brief.md"
{
  cat "$BRIEF"
  printf '\n\nRules: edit only what SCOPE allows; read AGENTS.md first (Next 16 differs from training data, docs in node_modules/next/dist/docs/); no new dependencies; never print env values.\n\n'
  node "$REPO/scripts/repomap.mjs" "$REPO"
} > "$FULL"

ARGS=(run -m "$MODEL" -d "$WT" --budget 400000 --check "$CHECK")
[ -n "$SPARSE" ] && ARGS+=(--sparse "$SPARSE")
set +e
student "${ARGS[@]}" "$FULL" </dev/null
RC=$?
set -e
rm -f "$FULL"
echo "--- worktree: $WT"
git -C "$WT" add -A -N . 2>/dev/null || true
git -C "$WT" diff --stat HEAD -- . ':!node_modules' ':!.env.local' | tail -15
exit $RC
