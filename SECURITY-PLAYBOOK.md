# ImpactMap security playbook

This is the response and defense-in-depth policy. It is part of every change, not a separate project.

## Defense in depth

Every control ships in five layers:

1. **Primary** — the lowest layer that can enforce it (database trigger, RLS, constraint, server route).
2. **Backup** — an independent control that still works if the primary is removed or bypassed (second trigger, server-side check, least-privilege grant, UI fallback).
3. **Detection** — an automated check that fails when the primary or backup disappears (`npm run audit:defenses`, Supabase advisors, `check.sh`).
4. **Restoration** — a versioned migration plus `scripts/reapply-defenses.sh`; never rely on a manual dashboard change.
5. **Red-team evidence** — a bypass attempt saved with request/response (`BREAK-REPORT.md`), not a claim.

A fix is not done until its detection check fails when the control is removed.

## Honeypot and canary

- `/api/security/canary` is a hidden, unlinked route. Any hit is logged to `security_audit_log` with a hashed IP, user agent, referer and path; it returns 404 and never reads application data.
- The canary is linked only inside a hidden footer node (`display:none`, `aria-hidden`), so users and screen readers do not follow it.
- Alerts: monitor `security_audit_log` for `action = 'honeypot_hit'`. A hit is a `P2` signal; repeated hits from one hashed IP are `P1`.
- Do not turn the canary into an admin panel, fake login, or data store. Isolation is the point.

## Zero-day posture

Assume any one layer is compromised. The remaining layers must still contain the blast radius:

- Least privilege: anon sees only public discovery columns; mutations require an authenticated account; the service role is server-only.
- Isolation: demo/test data is separate; no production secrets in client bundles; no canary access to app data.
- Bounded blast radius: short-lived tokens, no broad `ALL`/`TRUNCATE` grants, RLS on every public table.
- Detection: canary, audit log, Supabase advisors, dependency audit, live break tests.
- Recovery: restore from backup, reapply migrations, rotate secrets, verify with the defense audit.

Zero-day readiness is not a guarantee. It is the ability to detect, contain, restore, and prove it.

## Incident response

1. **Detect** — canary hit, advisor finding, break-test failure, anomalous anon read, or auth spike.
2. **Triage** — classify P1/P2/P3; identify affected data and accounts; preserve logs (do not delete the audit row).
3. **Contain** — rotate the service key, revoke sessions, disable the demo/reset route, stop affected background jobs, keep the site read-only if needed.
4. **Eradicate** — patch the control, add the backup, add the detection test, reapply the migration.
5. **Recover** — restore verified data, redeploy, run `npm run audit:defenses`, the live UI/a11y/theme loops, and the break suite.
6. **Postmortem** — write what failed, what the backup did, what detection missed, and the new test. Update `PRODUCT.md` and this playbook.

## Scope discipline

- No offensive tooling, no exploitation of third-party systems, no scanning outside this app.
- The canary logs only hashed/limited metadata; no PII and no request bodies.
- Test accounts and demo data only in red-team checks; never delete or mutate a real user's data.
