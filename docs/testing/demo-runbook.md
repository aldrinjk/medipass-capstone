# MediPass Supervisor Demo / Release Runbook

This runbook is the final manual acceptance path for the capstone prototype.
Use **synthetic or obviously fictional data only**.

## 1. Required services

### HAPI FHIR

From the repository root:

```bash
docker compose -f infra/docker-compose.yml up -d hapi-fhir
curl http://localhost:8081/fhir/metadata
```

The metadata request must return successfully before starting the API.

### Application database

Use the configured Supabase-hosted PostgreSQL database. Copy `.env.example`
to your local environment and supply the real server-side values privately:

- `SUPABASE_DB_URL`
- `SUPABASE_DB_USER`
- `SUPABASE_DB_PASSWORD`
- `JWT_SECRET`

Never commit the populated environment file.

## 2. Start the Spring Boot API

```bash
cd apps/api
mvn spring-boot:run
```

Expected API base URL: `http://localhost:8080`.

Health check:

```bash
curl http://localhost:8080/actuator/health
```

Expected status: `UP`.

## 3. Start the responder website

In a second terminal:

```bash
cd apps/responder-web
npm ci
npm run dev -- --host 0.0.0.0
```

For phone-to-phone testing, set `PUBLIC_RESPONDER_WEB_BASE_URL` on the backend
to a URL reachable by the scanning phone. The default `localhost:5173` works
only when the responder browser is on the same computer.

Responder verification defaults to the development provider:

```text
RESPONDER_OTP_PROVIDER=dev
RESPONDER_DEMO_OTP=123456
```

Development mode **does not send a real SMS**. The verification page explicitly
shows the test code so the complete flow can be demonstrated without external
SMS credentials. For real SMS, configure `RESPONDER_OTP_PROVIDER=twilio` plus
`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and
`TWILIO_VERIFY_SERVICE_SID` privately.

A phone OTP proves control of the supplied number at that moment. It does not,
by itself, prove the responder's self-declared name, role, or organization.
The full verified phone number is kept only in the responder page's in-memory
session so it can appear in the visible watermark; the patient audit record
still stores only the last four digits.

## 4. Start the Expo patient app

In a third terminal:

```bash
cd apps/mobile
npm install --legacy-peer-deps
```

Create `apps/mobile/.env`:

```text
EXPO_PUBLIC_API_BASE_URL=http://<LAPTOP_LAN_IP>:8080
EXPO_PUBLIC_USE_MOCKS=false
```

Then:

```bash
npx expo start
```

The phone and laptop should be on the same network. Remember that
`localhost` on a physical phone refers to the phone itself.

## 5. Required end-to-end demonstration

Perform the following in order:

1. Register a new fictional patient account.
2. Log in and confirm the authenticated dashboard loads.
3. Enter patient demographics.
4. Add at least one allergy, medication, and condition.
5. Add an emergency contact.
6. Save sharing preferences. For a clear demo, enable some categories and
   deliberately leave at least one category disabled.
7. Create an emergency pass with a short but sufficient expiry window.
8. Confirm the patient app displays a QR code.
9. Scan the QR with a second phone's normal camera.
10. Confirm the responder page opens without requiring a MediPass patient
    account or installed responder app, but **does not show clinical data yet**.
11. Complete the responder verification gate using fictional responder details.
    In development mode, use the clearly labelled test OTP shown by the page.
12. Confirm the emergency summary opens only after verification and that only
    the patient's currently saved sharing categories are visible. New pass
    issuance re-reads the server-stored preferences, so a stale client must not
    re-enable a disabled category.
13. Confirm the banner states the responder name/role/organization, verification
    method, masked phone digits when applicable, device label, and trace code.
    For PHONE_OTP, the phone is verified while the name remains self-declared.
14. Return to the patient app and confirm the successful access appears in the
    audit history with the same responder metadata, verification method, device,
    and trace code.
15. Take a screenshot of the responder view and confirm its watermark is legible
    and, after phone verification, contains the responder's full verified phone
    number plus responder accountability data and the same trace code. The
    browser cannot report that a screenshot was taken; the watermark supports
    later forensic correlation if a captured image exists.
16. Revoke the pass.
17. Scan/reload the same QR again.
18. Confirm the responder receives the revoked/410 experience and no clinical
    summary is shown.
19. Optionally rotate a fresh active pass and confirm the previous token no
    longer works.
20. Separately test **Emergency access without phone verification**. Confirm the
    view and patient audit log clearly label it as an unverified emergency
    override and record the responder-supplied reason.

## 6. FHIR verification

After creating clinical information through MediPass, use the authenticated:

`GET /api/v1/patients/me/fhir-bundle`

The response must be `application/fhir+json` and contain the patient-scoped
FHIR R4 resources.

The repository also includes
`data/synthea/medipass-demo-bundle.json` for deterministic synthetic import
testing.

## 7. Automated release gate

Before the demo/release candidate is accepted:

```bash
cd apps/api
mvn -B verify
```

And verify the GitHub Actions CI checks for the integration PR are green:

- Backend
- Patient mobile frontend
- Responder web frontend

Also run the verified responder k6 smoke test described in the testing guide.
The final capstone demo baseline is p95 latency under 4 seconds with an HTTP
error rate under 1%. The historical 500 ms target predates the final
HAPI-backed clinical projection and responder-accountability request path.

The backend verification includes real PostgreSQL/Flyway and HAPI FHIR R4
Testcontainers integration tests.

## 8. Manual compatibility checks

At minimum verify:

- Expo patient app on one physical phone
- QR scanning with a second physical phone
- responder layout around 360-400px width
- at least two browser engines where available
- active pass
- invalid token
- expired pass
- revoked pass
- rotated token
- temporary network failure/retry; the responder should leave the loading state
  and show the retryable connection error in roughly 10 seconds
- no hidden ShareCategory appears in the responder output
- clinical information is not returned before responder verification or an explicit emergency override
- phone-OTP access records responder name/role/organization, masked last four phone digits, device, and trace code
- phone OTP is described accurately as proof of phone control, not legal-name verification
- emergency override is clearly labelled unverified and records the stated reason
- responder watermark contains the responder's full verified phone number for that in-memory session, plus responder accountability metadata and the same trace code as the patient audit log
- watermark copies remain spaced and readable on a narrow mobile viewport rather than overlapping
- browser screenshot limitation is documented: capture cannot be detected or
  universally blocked, but captured responder views are watermarked for
  correlation to an access record

## 9. Demo-day fallback

If the external Supabase connection is unavailable:

1. Start the optional local PostgreSQL profile:
   `docker compose -f infra/docker-compose.yml --profile local-db up -d`.
2. Point the Spring datasource environment values to the local database.
3. Restart the API so Flyway applies the schema.

If HAPI needs a clean reset:

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d hapi-fhir
```

If the patient app loses a locally cached active QR URL, use **Rotate Link** to
issue a new token/QR. The backend intentionally stores only the token hash and
cannot reconstruct an old raw public token.

## 10. Release sign-off

Do not merge a release candidate into `develop` until:

- CI is green.
- The full manual scenario above succeeds.
- No real patient information or credentials appear in the repository,
  screenshots, logs, or demo data.
- Any remaining non-critical limitations are written down for the supervisor.
