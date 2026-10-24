# Defense audit

Target: https://zolvpddzpimegnkimszh.supabase.co (site: https://impactmap.vercel.app)
Generated: 2026-10-24T22:36:19.763Z

- PASS anon cannot read organization_members — 401 {"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT
- PASS anon cannot read security_audit_log — 401 {"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT
- PASS anon cannot enumerate volunteer_hours — 401 {"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT
- PASS anon cannot read profile email — 401 {"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT
- PASS anon cannot read private profile fields — 401 {"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT
- PASS anon can read the k-anonymous impact summary — 200 {"map": [], "totals": {"hours": 36.00, "events": 12, "records": 12, "students": 10, "organizations":
- PASS anon can read public organization name (backup grant present) — 200 [{"id":"11111111-1111-1111-1111-111111111101","name":"Edison Student Food Drive"}]
- PASS frame-ancestors none — default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://zolvpddzpimegnkimszh.supabase.co wss://zolvpddzpimegnkimszh.supabase.co; font-src 'self' data:; frame-ancestors 'none'
- PASS x-frame-options DENY — DENY
- PASS no unsafe-eval in CSP (hardening target) — absent
- PASS demo reset rejects cross-site/no-origin — 403

All checks passed
