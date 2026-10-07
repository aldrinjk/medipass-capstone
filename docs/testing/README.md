# MediPass Testing Guide

Owned by Member 5 (Audit, Admin, Integration, DevOps & Quality Engineering).
This is the practical companion to the acceptance gates in the team roadmap:
how to actually run each test layer, what each one proves, and how to reset
your environment between runs.

All test data below is synthetic. Never put real patient information into any
of these flows, including ad-hoc manual testing.

## Test layers

| Layer | Where | Command | Needs Docker? |
|---|---|---|---|
| Unit / component | `apps/api/src/test/java` (`*Tests.java`) | `mvn test` | No (uses H2) |
| Integration | `PostgresFlywayIT` + `HapiFhirClinicalServiceIT` (`*IT.java`) | `mvn verify` | Yes (Testcontainers) |
| End-to-end flow | `apps/api/src/test/java/com/medipass/e2e/MediPassEndToEndFlowTests.java` | `mvn test` (runs with the unit suite) | No |
| Performance | `infra/k6/public-pass-load-test.js` | see [Performance testing](#performance-testing) | Yes (or a native k6 install) |

Run everything backend CI runs with:

```bash
cd apps/api
mvn -B verify
```

### Unit / component tests

Fast, run against an in-memory H2 database in PostgreSQL-compatibility mode
(`application-test.yml`, `test` profile). This is what `mvn test` runs and
what CI's `backend` job gates on for every PR.

### Integration tests (`*IT.java`)

`PostgresFlywayIT` spins up a real `postgres:16-alpine` container via
Testcontainers and:

- Applies every Flyway migration (`V1`-`V8`) against a real Postgres engine,
  not H2 - this is what actually catches a dialect-specific migration
  mistake before it reaches the hosted Supabase database.
- Round-trips a `User`, `EmergencyPass`, and `PassAccessLog` through JPA to
  confirm the repository layer works against the real engine.

The second integration test, `HapiFhirClinicalServiceIT`, starts the real
`hapiproject/hapi:v7.4.0` image and verifies MediPass against an actual HAPI
FHIR R4 server. It covers Patient profile persistence, AllergyIntolerance,
MedicationStatement, Condition, Patient.contact, update/delete behavior,
emergency Bundle generation, and synthetic FHIR import.

These tests are bound to the Maven `verify` phase via the failsafe plugin (not
`test`), so the fast unit suite stays fast and CI's `mvn -B verify` step picks
them up automatically. A local Docker daemon is required.

### End-to-end flow test

`MediPassEndToEndFlowTests` drives the exact "First Development Goal" flow
from the team roadmap through the real REST contract in one ordered test:

```
register -> login -> create profile -> add allergy/medication/condition
-> select sharing categories -> create pass -> public (QR) access
-> access gets logged -> revoke -> same token blocked (410)
```

This backend-driven test proves the REST contract supports the complete
patient-to-public-pass lifecycle. The Expo patient app and React/Vite responder
site now exist and are separately built/type-checked/tested in CI. Physical
camera scanning and cross-device browser behavior remain manual release checks
because they require real devices.

### Performance testing

`infra/k6/public-pass-load-test.js` load-tests the verified emergency-summary
hot path after the responder gate. An anonymous first GET to an active pass now
correctly returns `428 RESPONDER_VERIFICATION_REQUIRED`, so the k6 script
creates one short-lived **emergency override** session during `setup()` and
then sends `X-MediPass-Verification` on each measured summary request.

This deliberately avoids depending on an SMS provider. It benchmarks the
clinical-summary request after the gate; it does **not** benchmark SMS/OTP
delivery.

Steps:

1. Start the API against a working datasource and HAPI FHIR.
2. Create an active pass and extract the raw token from
   `CreatePassResponse.publicUrl`.
3. Run k6. On Docker Desktop:

   ```bash
   docker run --rm -i -e BASE_URL=http://host.docker.internal:8080 \
     -e PASS_TOKEN=<raw-token> \
     grafana/k6 run - < infra/k6/public-pass-load-test.js
   ```

   On Linux with native k6, use `BASE_URL=http://localhost:8080`.

The setup responder is entirely fictional. The load test expects the pass to
remain active for the run and verifies `200`, presence of an access trace code,
and absence of `userId` from the public clinical payload.

Thresholds remain p95 latency under 500 ms and error rate under 1%. Re-baseline
these numbers in the final demo environment because HAPI-backed clinical reads
and responder verification were added after the earliest performance run.

## Resetting your environment

**Backend data** (Supabase-hosted, or the local-db profile): the fastest
clean slate is dropping and letting Flyway re-apply from `V1`, or just using
a fresh database. There is no destructive reset endpoint in the API by
design - don't add one that isn't gated far more carefully than anything
else in this codebase.

**HAPI FHIR** (local dev): the image defaults to an in-memory H2 database, so
it resets on every container restart:

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d hapi-fhir
curl http://localhost:8081/fhir/metadata   # confirm it's back up
```

**Local Postgres profile** (offline dev only, never used by CI):

```bash
docker compose -f infra/docker-compose.yml --profile local-db down -v
docker compose -f infra/docker-compose.yml --profile local-db up -d
```

## Test / demo accounts

There is no seed data and no self-service admin promotion API by design -
every account starts as `PATIENT` (see `apps/api/.../auth/User.java`). To
exercise the `/api/v1/admin/**` endpoints locally:

1. Register a normal account through `POST /api/v1/auth/register`.
2. Promote it directly in the database (local/demo environments only):
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = '<your-demo-email>';
   ```
   (`User.promoteToAdmin()` is the equivalent in-process call, used by
   `AdminControllerTests` to set up an admin principal without touching the
   database directly.)
3. Log in again so the new JWT carries the `ADMIN` role claim - existing
   tokens issued before the promotion still carry the old role.

Never do this against a database holding anything other than synthetic data.

## Access-log field dictionary (audit hardening)

`pass_access_log` / `PassAccessLog` stores application audit metadata only;
it never stores clinical content or raw public/verification tokens.

Patient-facing `AccessLogResponse` omits `userId` and `correlationId`.
Admin-facing `AdminAccessLogResponse` includes those internal support fields.

| Field | Meaning | Privacy / assurance notes |
|---|---|---|
| `id` | Audit row UUID | Internal record identifier |
| `passId` | Pass associated with the attempt | `null` for a token that never resolved |
| `userId` | Patient/pass owner | Admin-facing only; not responder identity |
| `outcome` | `SUCCESS`, `EXPIRED`, `REVOKED`, or `INVALID` | Clinical data is returned only for `SUCCESS` |
| `correlationId` | Request correlation value | Admin-facing support/debug field |
| `traceCode` | Server-generated `MP-...` code | Matches the responder banner/watermark for forensic correlation |
| `responderDevice` | Browser-visible device/browser label | Privacy-limited label such as `iPhone · Safari`; not a MAC address or guaranteed physical-device identity |
| `responderName` | Self-declared responder name | Phone OTP does not independently verify this legal name |
| `responderRole` | Self-declared role | Optional |
| `responderOrganization` | Self-declared organization | Optional |
| `responderPhoneLast4` | Last four digits after phone verification | Full phone is not persisted in the audit database |
| `verificationMethod` | `PHONE_OTP`, `EMERGENCY_OVERRIDE`, or reserved stronger future method | Development OTP is explicitly labelled as a simulation |
| `verificationNote` | Assurance note or emergency-override reason | Used to distinguish simulated OTP and unverified override context |
| `accessedAt` | Server timestamp | UTC |

**Deliberately not persisted:** raw public pass token, responder verification
token, OTP code, full responder phone number, IP address, raw user-agent string,
or clinical payload. The responder web may keep the full verified phone number
only in page memory so it can appear in the visible forensic watermark for that
session.


## Audit failure policy

Application access auditing is authoritative and normally persists in a separate `REQUIRES_NEW` transaction. The public-pass orchestration calls it through a fail-safe wrapper:

- a successful emergency summary is not converted into a server error only because the audit store is temporarily unavailable;
- invalid, expired, and revoked token responses keep their intended 404/410 behavior even if the audit write fails;
- the failure is written to the application log with the outcome/pass id when known;
- raw public tokens and clinical content are never written to that warning log.

`PublicPassAuditFailureTests` verifies the success and invalid-token failure paths. This behavior keeps emergency access availability independent from temporary audit persistence outages while preserving the normal audit path whenever the application database is healthy.

### `AccessOutcome` semantics

- `SUCCESS` - the token resolved to an active, non-expired pass and the
  filtered emergency summary was returned.
- `EXPIRED` - the token resolved to a real pass whose `expiresAt` has passed
  (or whose stored status was already `EXPIRED`). Responds `410`.
- `REVOKED` - the token resolved to a real pass the patient explicitly
  revoked. Responds `410`.
- `INVALID` - the token didn't resolve to any pass at all (typo, tampered,
  or never existed). Responds `404`. `passId`/`userId` are `null` because
  there is nothing to attribute the attempt to.

Full coverage of all four outcomes lives in
`apps/api/src/test/java/com/medipass/pass/PublicPassTests.java`.


## Frontend dependency audit

CI runs an advisory production-dependency audit for both frontends:

```bash
cd apps/mobile
npm audit --omit=dev --audit-level=high

cd ../responder-web
npm audit --omit=dev --audit-level=high
```

These audit steps are intentionally non-blocking because Expo/React Native
dependency trees can contain transitive advisories that require coordinated SDK
upgrades rather than blind package overrides. Review the advisory output before a
release candidate. Do **not** run `npm audit fix --force` without checking Expo,
React Native, and Vite compatibility first.

The install-time vulnerability count includes development dependencies and is
not, by itself, evidence that the shipped/runtime application is exploitable.

## Final supervisor demo

Use [demo-runbook.md](demo-runbook.md) for the final cross-device acceptance and fallback procedure.
