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

- Applies every Flyway migration (`V1`-`V6`) against a real Postgres engine,
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

`infra/k6/public-pass-load-test.js` load-tests the one endpoint where
response time is a patient-safety concern: the anonymous public pass lookup
a responder hits right after scanning a QR code. It only ever calls that
endpoint - no JWT, no authenticated routes.

Steps (tested against a real local run - see command output below):

1. Start the API against any working datasource (Supabase, or the local
   `docker compose --profile local-db up -d postgres` profile - see the
   root `infra/docker-compose.yml`).
2. Create one active pass and grab its raw token from
   `CreatePassResponse.publicUrl` (the last path segment):
   ```bash
   TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"<demo-email>","password":"<demo-password>"}' \
     | python -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

   curl -s -X POST http://localhost:8080/api/v1/passes \
     -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
     -d '{"categories":["ALLERGIES"],"expiresAt":"2027-01-01T00:00:00Z"}'
   # -> take the last "/..." segment of publicUrl as PASS_TOKEN below
   ```
3. Run k6 against it. On Docker Desktop (Windows/macOS - confirmed working):
   ```bash
   docker run --rm -i -e BASE_URL=http://host.docker.internal:8080 \
     -e PASS_TOKEN=<raw-token> \
     grafana/k6 run - < infra/k6/public-pass-load-test.js
   ```
   On Linux with a native k6 install, use `BASE_URL=http://localhost:8080`
   directly instead.

Thresholds: p95 latency under 500ms, error rate under 1%. The historical
~330ms result was measured before the HAPI-backed clinical adapter landed, so
performance should be re-baselined in the final demo environment with HAPI
FHIR running.

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

`pass_access_log` / `PassAccessLog` (patient-facing `AccessLogResponse` omits
`userId` and `correlationId`; the admin-facing `AdminAccessLogResponse`
includes both):

| Field | Meaning | Privacy notes |
|---|---|---|
| `id` | Log row id (UUID) | Internal identifier only |
| `passId` | The pass that was accessed, if the token resolved to one | `null` for `INVALID` outcomes (token never matched a pass) |
| `userId` | The pass owner, if known | `null` for `INVALID` outcomes; never the responder's identity - responders are anonymous by design |
| `outcome` | One of `SUCCESS`, `EXPIRED`, `REVOKED`, `INVALID` | See below |
| `correlationId` | Request-scoped id, from the `X-Correlation-Id` request header if the caller supplied one, otherwise generated (`CorrelationIdFilter`) | Lets ops/support cross-reference an access-log row with application logs for the same request; never derived from or containing the raw pass token |
| `accessedAt` | Server timestamp (UTC) | - |

**What is deliberately never stored**: the raw public pass token (only its
SHA-256 hash lives on `emergency_pass`, and access logs don't reference it at
all), the responder's IP address, user agent, or any other request metadata
beyond the correlation id, and no clinical content (allergies, medications,
etc. are never written to the audit log, only which pass/outcome occurred).

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


## Final supervisor demo

Use [demo-runbook.md](demo-runbook.md) for the final cross-device acceptance and fallback procedure.
