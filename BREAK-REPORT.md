# ImpactMap live break report

Date: 2026-10-24
Target: https://impactmap.vercel.app
Hosted API: https://zolvpddzpimegnkimszh.supabase.co
Scope: live routes, headers, APIs, anonymous Supabase reads/RPCs, stored-XSS sinks. Not a full pentest; no destructive payloads, no load testing, no production data deletion.

## Findings

### P1 — anonymous users can read organization_members
`GET /rest/v1/organization_members?select=*&limit=3` with the public anon key returned **200 with real rows** (user_id, organization_id, role, created_at). This exposes internal membership/user identifiers. Evidence:
`organization_members :: 200 433` followed by rows.

### P1 — default broad grants remain
The hosted audit showed `anon` and `authenticated` holding **ALL table privileges, including TRUNCATE/REFERENCES/TRIGGER**, on 11 public tables (`applications`, `volunteer_hours`, `profiles`, `organizations`, `security_audit_log`, `coordinator_requests`, `organization_members`, `event_checkins`, `app_events`, `opportunities`, `pilot_requests`). RLS is the only guard. `security_audit_log` is reachable by `anon` (currently returns `[]` under RLS, but the grant is wrong).

### P1 — verification code returns student PII
`POST /rest/v1/rpc/verify_code {"p_code":"IMP-DEMO2026ABCD"}` returns **200** with `name: "Demo Student"`, event, hours and description. This is intended for the bearer of the code, but the code is a bearer credential and the demo code is published; real codes expose the student name and notes to anyone who obtains the code.

### P1 — demo reset is broken in production
`POST /api/demo/reset` returns **503** `{"error":"Demo storage is not configured."}`. The runtime lacks `SUPABASE_SERVICE_ROLE_KEY`; the button cannot restore the single-use pending log.

### P2 — public surfaces get 401 on organizations/profiles
With the anon key, `GET /rest/v1/organizations` and `/profiles` return **401 permission denied**. Any public page or join that depends on those tables can silently lose organization names or fail. `/opportunities` still returned 200, so this needs a route-level check rather than assuming it is harmless.

### P2 — CSP allows inline and eval
The live CSP is `script-src 'self' 'unsafe-inline' 'unsafe-eval'`. The map popups escape HTML and React escapes content, but the CSP weakens the defense-in-depth for any future sink. `x-powered-by: Next.js` is also exposed.

### P3 — missing offline/SEO routes
`/offline`, `/sitemap.xml` and `/robots.txt` return **404**. The offline experience depends on the service worker’s cached fallback; a direct offline URL and crawler files are absent.

## Good results

- `X-Frame-Options: DENY`, HSTS, `X-Content-Type-Options: nosniff`, strict referrer policy, permissions policy.
- `/api/verify/bulk`: GET **405**, empty/bad JSON **400**.
- `/api/demo/reset` with `Origin: https://evil.example`: **403**.
- `/.env`, `/.git/config`, `/admin`, `/verify/INVALID`, `/organizations/INVALID`: **404**.
- `/dashboard`, `/profile`, `/passport`, `/checkin/INVALID`: **307** auth redirects.
- Anon reads of `volunteer_hours`, `applications`, `security_audit_log`, `event_checkins`, `coordinator_requests`, `app_events` return `[]` under RLS.
- Map popups use `escapeHtml`; only the layout’s static `dangerouslySetInnerHTML` remains, and no user-controlled HTML sink was found.
- Live UI loop, accessibility gate and theme loop pass.

## Reproduction

```bash
curl -sSI https://impactmap.vercel.app/
curl -sS https://impactmap.vercel.app/rest/v1/nonexistent
curl -sS "https://zolvpddzpimegnkimszh.supabase.co/rest/v1/organization_members?select=*&limit=3" \
  -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>"
curl -sS -X POST "https://zolvpddzpimegnkimszh.supabase.co/rest/v1/rpc/verify_code" \
  -H "apikey: <ANON>" -H "Authorization: Bearer <ANON>" \
  -H 'Content-Type: application/json' -d '{"p_code":"IMP-DEMO2026ABCD"}'
curl -sS -X POST https://impactmap.vercel.app/api/demo/reset
```

The anon key is public by design; the findings are about what it can reach, not about key secrecy.
