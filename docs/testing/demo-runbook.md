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
10. Confirm the React responder page opens without login or MediPass installed.
11. Confirm only categories selected in the pass are visible.
12. Return to the patient app and confirm the successful access appears in the
    access audit history.
13. Confirm that the access entry shows a server-generated trace code and a
    browser-visible responder device label. The same values must appear in the
    responder watermark/banner so a captured image can be correlated back to
    the access record.
14. Revoke the pass.
15. Scan/reload the same QR again.
16. Confirm the responder receives the revoked/410 experience and no clinical
    summary is shown.
17. Optionally rotate a fresh active pass and confirm the previous token no
    longer works.

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
- temporary network failure/retry
- no hidden ShareCategory appears in the responder output
- responder watermark contains the same trace code/device label as the patient audit log
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
