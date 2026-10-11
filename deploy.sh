#!/usr/bin/env bash
# One-command production deploy: hosted Supabase (schema + seed) + Vercel.
# Prereqs (once, interactive): `supabase login` and `npx vercel login`.
# Re-runnable: reuses the project ref saved in .env.deploy.local.
set -euo pipefail
cd "$(dirname "$0")"

STATE=.env.deploy.local   # gitignored (.env*)
[ -f "$STATE" ] && source "$STATE"
VERCEL="npx --yes vercel@latest"

supabase projects list >/dev/null 2>&1 || { echo "Run: supabase login"; exit 1; }
$VERCEL whoami >/dev/null 2>&1 || { echo "Run: npx vercel login"; exit 1; }

# 1. Supabase project
if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  ORG_ID=$(supabase orgs list -o json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].id))')
  DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
  PROJECT_NAME=${SUPABASE_PROJECT_NAME:-impactmap-cac}   # old paused 'impactmap' project holds a stale schema
  echo "Creating Supabase project '$PROJECT_NAME' (free tier)…"
  SUPABASE_PROJECT_REF=$(supabase projects create "$PROJECT_NAME" --org-id "$ORG_ID" --region us-east-1 \
    --db-password "$DB_PASSWORD" -o json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).id))')
  [ -n "$SUPABASE_PROJECT_REF" ] || { echo "Project creation failed"; exit 1; }
  printf 'SUPABASE_PROJECT_REF=%s\nSUPABASE_DB_PASSWORD=%s\n' "$SUPABASE_PROJECT_REF" "$DB_PASSWORD" > "$STATE"
  echo "Waiting for the database to come up…"
  sleep 90
fi
export SUPABASE_DB_PASSWORD=${SUPABASE_DB_PASSWORD:-$DB_PASSWORD}

supabase link --project-ref "$SUPABASE_PROJECT_REF" -p "$SUPABASE_DB_PASSWORD"
supabase db push --include-seed -p "$SUPABASE_DB_PASSWORD" --yes

SUPABASE_URL="https://$SUPABASE_PROJECT_REF.supabase.co"
ANON_KEY=$(supabase projects api-keys --project-ref "$SUPABASE_PROJECT_REF" -o json \
  | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).find(k=>k.name==="anon").api_key))')

# 2. Vercel project + env + deploy
$VERCEL link --yes --project impactmap >/dev/null
for name in NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS; do
  $VERCEL env rm "$name" production --yes >/dev/null 2>&1 || true
done
# Public-by-design values (the anon key is gated by RLS), so store as plain config without prompts.
ADD="env add --force --no-sensitive --yes"
printf '%s' "$SUPABASE_URL" | $VERCEL $ADD NEXT_PUBLIC_SUPABASE_URL production >/dev/null
printf '%s' "$ANON_KEY" | $VERCEL $ADD NEXT_PUBLIC_SUPABASE_ANON_KEY production >/dev/null
printf '' | $VERCEL $ADD NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS production >/dev/null 2>&1 || true

# Newer CLIs print progress and the alias in the output; take the production alias (shortest impactmap URL).
DEPLOY_LOG=$($VERCEL deploy --prod --yes 2>&1) || { echo "$DEPLOY_LOG" | tail -20; exit 1; }
SITE_URL=$(echo "$DEPLOY_LOG" | grep -oE 'https://impactmap[a-z0-9-]*\.vercel\.app' | awk '{print length, $0}' | sort -n | head -1 | cut -d' ' -f2 || true)
[ -n "$SITE_URL" ] || { echo "Could not find deploy URL"; echo "$DEPLOY_LOG" | tail -20; exit 1; }

# 3. Auth settings: production site URL; email confirmation off (free-tier email is rate-limited to a few/hour,
#    which would block judges and classmates from signing up).
cp supabase/config.toml /tmp/impactmap-config.toml.bak
sed -i.tmp -e "s#^site_url = .*#site_url = \"$SITE_URL\"#" \
  -e "s#^additional_redirect_urls = .*#additional_redirect_urls = [\"$SITE_URL/**\", \"http://127.0.0.1:3000/**\"]#" supabase/config.toml
supabase config push --project-ref "$SUPABASE_PROJECT_REF" --yes || echo "WARN: config push failed — set Site URL to $SITE_URL in Supabase → Auth → URL Configuration"
mv /tmp/impactmap-config.toml.bak supabase/config.toml; rm -f supabase/config.toml.tmp

echo
echo "Live: $SITE_URL"
echo "Smoke test: BASE_URL=$SITE_URL npm run test:ui  (needs the hosted DB URL/key in .env.local to run test:db)"
