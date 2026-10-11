#!/usr/bin/env bash
# One-command production deploy: hosted Supabase (schema + seed) + Vercel.
# Prereqs (once, interactive): `supabase login` and `npx vercel login`.
# Re-runnable: reuses the project ref saved in .env.deploy.local.
set -euo pipefail
cd "$(dirname "$0")"

STATE=.env.deploy.local   # gitignored (.env*)
[ -f "$STATE" ] && source "$STATE"
VERCEL="npx --yes vercel@39"

supabase projects list >/dev/null 2>&1 || { echo "Run: supabase login"; exit 1; }
$VERCEL whoami >/dev/null 2>&1 || { echo "Run: npx vercel login"; exit 1; }

# 1. Supabase project
if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  ORG_ID=$(supabase orgs list -o json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d)[0].id))')
  DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'A-Za-z0-9' | head -c 24)
  echo "Creating Supabase project 'impactmap' (free tier)…"
  SUPABASE_PROJECT_REF=$(supabase projects create impactmap --org-id "$ORG_ID" --region us-east-1 \
    --db-password "$DB_PASSWORD" -o json | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>console.log(JSON.parse(d).id))')
  printf 'SUPABASE_PROJECT_REF=%s\nSUPABASE_DB_PASSWORD=%s\n' "$SUPABASE_PROJECT_REF" "$DB_PASSWORD" > "$STATE"
  echo "Waiting for the database to come up…"
  sleep 90
fi
export SUPABASE_DB_PASSWORD

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
printf '%s' "$SUPABASE_URL" | $VERCEL env add NEXT_PUBLIC_SUPABASE_URL production >/dev/null
printf '%s' "$ANON_KEY" | $VERCEL env add NEXT_PUBLIC_SUPABASE_ANON_KEY production >/dev/null
printf '' | $VERCEL env add NEXT_PUBLIC_ENABLED_OAUTH_PROVIDERS production >/dev/null 2>&1 || true

DEPLOY_URL=$($VERCEL deploy --prod --yes)
SITE_URL=$($VERCEL inspect "$DEPLOY_URL" 2>&1 | grep -oE 'https://impactmap[a-z0-9-]*\.vercel\.app' | head -1)
SITE_URL=${SITE_URL:-$DEPLOY_URL}

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
