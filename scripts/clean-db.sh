#!/usr/bin/env bash
# Local Supabase runs in Docker on CLEAN (not the Mac); ports are tunneled to localhost so
# .env.local, `npm run dev` and the tests work unchanged.
# Usage: scripts/clean-db.sh [up|reset|tunnel|stop]   (default: up)
set -euo pipefail
cd "$(dirname "$0")/.."
HOST=${CLEAN_HOST:-CLEAN}
DIR=impactmap-db
SB="npx --yes supabase@2.120.0"
PORTS=(54321 54322 54323 54324)

sync() { rsync -az --delete supabase/ "$HOST:$DIR/supabase/"; }
remote() { ssh "$HOST" "source ~/.nvm/nvm.sh >/dev/null 2>&1; cd ~/$DIR && $*"; }

tunnel() {
  pgrep -f "ssh -f -N .*-L 54321:localhost:54321" >/dev/null && return 0
  local args=(); for p in "${PORTS[@]}"; do args+=(-L "$p:localhost:$p"); done
  ssh -f -N -o ExitOnForwardFailure=yes -o ServerAliveInterval=30 "${args[@]}" "$HOST"
}

case "${1:-up}" in
  up)     sync; remote "$SB status >/dev/null 2>&1 || $SB start"; tunnel; echo "Local DB on $HOST → http://127.0.0.1:54321" ;;
  reset)  sync; remote "$SB db reset"; tunnel ;;
  tunnel) tunnel ;;
  stop)   pkill -f "ssh -f -N .*-L 54321:localhost:54321" || true; remote "$SB stop" ;;
  *)      echo "usage: $0 [up|reset|tunnel|stop]"; exit 1 ;;
esac
