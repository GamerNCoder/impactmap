# ImpactMap agent guide

Security changes require all five layers: primary control, independent backup, detection test,
versioned restore, and saved red-team evidence. Use `SECURITY-PLAYBOOK.md`; never claim a
security fix from the code alone. The canary is defensive only and must stay isolated from app
data.

# ImpactMap agent guide

Read `PRODUCT.md` before changing anything. It is the product invariants and the 48-hour order
of operations.

Non-negotiable defaults:

- Inclusion is a release gate: wheelchair/sensory flags and filters, map text alternatives,
  keyboard/screen-reader volunteer path, language switcher + Spanish core. Do not claim full
  translation or full offline.
- Trust: no self-approval (including the second-account/coordinator-collusion path), check-in is
  a signal not proof, public impact is k-anonymous, unverified organizers are always labeled.
- The CAC narrative is the local problem, the working loop, the trust/privacy insight, and
  evidence — not a feature list or an AI wrapper.
- Before new features, finish the audit fixes in `PRODUCT.md` and record the demo.

## Definition of done

`PRODUCT.md` is a living operating brief. Update its **Current state** and **Decision log** in
the same change as any feature, migration, security rule, accessibility/i18n change, or scope cut.
If an invariant changes, edit the invariant first and then the code. A change is not complete
until the brief matches the app.
