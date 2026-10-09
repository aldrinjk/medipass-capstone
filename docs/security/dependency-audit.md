# Frontend Dependency Audit — Release Candidate Note

This note records the production-dependency audit performed during final PR #13
cleanup. It is a capstone release-hygiene record, not a claim of regulatory or
clinical security certification.

## Commands

GitHub Actions runs these as advisory (non-blocking) checks:

```bash
cd apps/mobile
npm audit --omit=dev --audit-level=high

cd ../responder-web
npm audit --omit=dev --audit-level=high
```

## Current findings

### Responder web

Production dependency audit: **0 vulnerabilities**.

The responder application still runs its normal lint, TypeScript/Vite production
build, and Vitest suite as blocking CI checks.

### Expo patient app

The production-dependency audit currently reports:

- 10 moderate
- 19 high
- 1 critical
- 30 total

The audit output includes transitive packages in the Expo / Metro / React Native
dependency graph, including findings involving `braces`, `micromatch`,
`node-forge`, and `uuid`, plus other transitive packages such as
`brace-expansion`, `compression`, `shell-quote`, and `source-map-js`.

Several audit suggestions require `npm audit fix --force` and propose breaking
changes to the Expo dependency graph (including an incompatible Expo downgrade
in the current resolver output). For that reason, the integration branch does
**not** apply a blind force-fix.

The install-time count is larger because it includes development dependencies;
the production-only audit above is the release-relevant baseline.

## Release decision

For the capstone prototype:

- do not run `npm audit fix --force` merely to reduce the count;
- keep Expo / React Native versions internally compatible;
- treat the mobile findings as a documented dependency-risk item for a future
  coordinated Expo SDK/toolchain upgrade;
- keep the advisory audit visible in CI so the findings cannot be silently
  forgotten;
- continue to block the PR on TypeScript/tests/backend verification rather than
  on an unsafe automated dependency downgrade.

Any production deployment beyond the capstone/demo scope should re-run the audit,
review each advisory's reachable runtime surface, and upgrade the Expo/Metro
stack in a dedicated dependency-hardening change.
