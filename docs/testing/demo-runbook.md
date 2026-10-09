# MediPass Supervisor Demo / Release Runbook

This is the final acceptance and demo procedure for the deployed MediPass capstone.
Use **synthetic or obviously fictional patient data only**.

## 1. Final public demo architecture

The normal supervisor demo uses the deployed services rather than a laptop-hosted
Expo/API stack:

- Patient: standalone MediPass Android APK
- API: `https://medipass-api-aldrinjk.onrender.com`
- Responder: `https://medipass-responder-web-aldrinjk.onrender.com`
- Application database: Supabase-hosted PostgreSQL
- Clinical FHIR service: `https://hapi.fhir.org/baseR4`
- OTP transport: MediPass Android SMS Relay running as a foreground service on
  the designated relay phone

The old Render static responder URL,
`https://medipass-responder-aldrinjk.onrender.com`, is not the supported QR
target. The Node responder service is required so direct `/passes/:token`
links receive the SPA fallback.

## 2. Demo-day preparation

### Patient APK

Install the latest successful `medipass-patient-apk` artifact generated from
the final release candidate. The recipient does not need Expo Go, ADB, a laptop,
or the same Wi-Fi network as the backend.

The release APK is built with:

```text
EXPO_PUBLIC_API_BASE_URL=https://medipass-api-aldrinjk.onrender.com
EXPO_PUBLIC_USE_MOCKS=false
```

### Android SMS Relay

Install the relay APK on the designated Android phone.

1. Open the relay app.
2. Confirm the API URL is
   `https://medipass-api-aldrinjk.onrender.com`.
3. Enter the current relay shared key locally on the phone. Never paste or commit
   the key anywhere else.
4. Grant SMS permission when required.
5. Tap **Start Relay**.
6. Wait for **Connected ✓ Waiting for OTP requests**.
7. Press Home and leave the relay foreground service running.

The relay phone needs internet access, an active SIM capable of sending SMS, and
a default SMS SIM selected on dual-SIM devices. Do not force-stop the relay app.

The relay key is intentionally not persisted. If Android kills the process or
the phone restarts, reopen the relay app and re-enter the key.

### Render cold-start note

The API is on Render's free tier and can take substantially longer than a normal
mobile request timeout to wake after being idle. Start the relay several minutes
before the demonstration. Its polling wakes the API and helps keep it active.

Before presenting, confirm the relay reports **Connected** and open the patient
app once so the backend is already warm.

## 3. Required patient-to-responder demonstration

Perform the following with fictional data:

1. Register a new patient account or sign in to a clean fictional demo account.
2. Open **Profile** and confirm the Clinical Profile Hub provides:
   - Demographics
   - Allergies & Reactions
   - Medications
   - Medical Conditions
   - Emergency Contact
3. Enter demographics.
4. Add at least one allergy, one medication, and one condition.
5. Add an emergency contact.
6. Open **Sharing** and enable only the categories you intend to expose. Leave at
   least one category disabled for the selective-disclosure demonstration.
7. Open **Passes** and create a new emergency pass.
8. Confirm the patient app displays the QR code and an ACTIVE status.
9. Scan the QR with a second phone's normal camera.
10. Confirm the responder page opens in the browser without requiring a MediPass
    patient account or responder app.
11. Confirm clinical data is not shown before the responder gate is completed.
12. Enter fictional responder name/role/organization information and a reachable
    verification phone number.
13. Confirm the relay phone sends the short MediPass OTP SMS.
14. Enter the OTP on the responder page.
15. Confirm the emergency summary opens and contains only categories selected by
    the patient when that pass was created.
16. Confirm the responder view shows accountability metadata and an `MP-...`
    trace code.
17. Return to the patient app and confirm the access event appears in the pass
    audit history with the matching responder context and trace information.

Phone OTP proves control of the supplied phone number at that moment. It does not
independently verify the responder's self-declared legal name, role, or
organization.

## 4. Sharing-scope test

This test demonstrates the patient-control requirement:

1. Enable Medications in Sharing and create a pass.
2. Verify Medications appear after responder verification.
3. Return to Sharing and disable Medications.
4. Create a **new** pass.
5. Verify the new responder view no longer contains Medications.

Sharing categories are captured from the server's current preferences when a new
pass is issued. Changing preferences does not retroactively rewrite the scope of
an already issued pass.

## 5. Pass lifecycle tests

Before final sign-off, verify:

- **Revoke:** revoke an active pass, then reload/scan its old QR and confirm no
  clinical summary is returned.
- **Rotate Link:** rotate an active pass and confirm the previous raw token no
  longer works while the new QR does.
- **Expired:** verify an expired pass produces the expired/410 experience and no
  clinical summary.
- **Invalid token:** verify a malformed/unknown token does not expose data.
- **Emergency override:** exercise emergency access without phone verification
  and confirm both responder UI and patient audit history clearly identify it as
  an unverified emergency override and preserve the responder-supplied reason.

## 6. FHIR verification

After creating clinical data, the authenticated endpoint:

`GET /api/v1/patients/me/fhir-bundle`

must return `application/fhir+json` containing the patient-scoped FHIR R4
resources.

The deployed demo uses the public HAPI test server. It is an external shared
demo dependency and can occasionally be slow or unavailable. Never store real
PHI there.

## 7. Automated release gate

A release candidate is not considered ready until GitHub Actions CI is green for
the exact candidate commit:

- Backend: `mvn -B verify`
- Patient mobile frontend typecheck/tests
- Responder web build/tests
- Android SMS Relay build

The patient APK workflow must also complete successfully for the final mobile
candidate.

The repository's verified k6 responder-summary test is documented in
`docs/testing/README.md`. The recorded final demo-environment result was:

- 232 / 232 functional checks passed
- HTTP failure rate: 0.00%
- Average request duration: 2.81 s
- p95 request duration: 3.52 s
- Maximum request duration: 3.93 s

This meets the final capstone baseline of p95 below 4 seconds and HTTP error rate
below 1%. The older 500 ms target is not the final acceptance threshold.

## 8. Physical-device compatibility checks

The following remain manual because CI cannot reproduce real SIM/camera/device
behavior:

- latest Patient APK installs over the previous build
- Profile tab returns to the Clinical Profile Hub
- bottom navigation stays above the Android gesture/home indicator
- Mild / Moderate / Severe allergy badges render with distinct severity colors
- pass ACTIVE / REVOKED / EXPIRED badges remain fully visible on a narrow screen
- QR scans successfully from a second physical phone
- responder layout is readable around 360-400 px width
- SMS OTP arrives on a reachable phone number
- responder summary is blocked before verification
- hidden sharing categories never appear
- access-log metadata is visible after successful access
- revoked/expired/rotated tokens stop working as expected
- responder watermark remains readable on a narrow viewport

Where practical, also verify the responder in two mobile browser engines.

## 9. Demo fallback

### If Render is asleep

Keep the relay running and wait for the API to finish waking. A first patient
request may fail while the free instance starts; retry after the relay reports
Connected.

### If the public HAPI test server is temporarily unavailable

Do not substitute real patient data. Retry after the service recovers. For an
offline/local technical demonstration, the repository can run its local HAPI
FHIR container:

```bash
docker compose -f infra/docker-compose.yml up -d hapi-fhir
```

and point `HAPI_FHIR_BASE_URL` to `http://localhost:8081/fhir`.

### If Supabase is unavailable

The repository includes an optional local PostgreSQL profile:

```bash
docker compose -f infra/docker-compose.yml --profile local-db up -d
```

Point the Spring datasource variables to that local database and restart the API
so Flyway can apply the schema.

### If the patient app no longer has the raw URL for an active pass

Use **Rotate Link** to issue a new token and QR. The backend intentionally stores
only the public-token hash and cannot reconstruct an old raw token.

## 10. Final release sign-off

Before calling MediPass v1.0 capstone complete:

- the release-candidate commit has green CI;
- the Patient APK build succeeded;
- the public API and responder services are deployed from the intended branch;
- the full patient -> QR -> responder -> OTP -> filtered emergency summary flow
  succeeds on physical devices;
- revocation/rotation/expiry behavior has been checked;
- no real patient information, relay key, JWT secret, database password, or
  other credential appears in source, screenshots, demo data, or documentation;
- known prototype limitations are stated accurately rather than represented as
  production healthcare/compliance guarantees.

MediPass is a capstone/research prototype, not a certified clinical system.
