# MediPass Capstone

**MediPass** is a patient-controlled QR-based emergency health passport. A patient maintains a small emergency profile, chooses which categories may be shared, creates a time-limited emergency pass, and displays its QR code in the MediPass mobile app. A responder scans the QR with a normal phone camera and opens a public browser page without installing MediPass or creating a patient account. Before clinical information is released, the responder completes phone verification or explicitly uses an unverified emergency override. The backend validates the token, expiry, revocation status, server-stored sharing scope, and responder session before returning only permitted emergency information. Public access is audited with responder accountability metadata and an `MP-...` trace code.

## Final capstone architecture

- **Patient app:** React Native + Expo + TypeScript, distributed for the capstone as a standalone Android APK
- **Navigation:** Expo Router
- **Public responder viewer:** React + TypeScript + Vite, served by a small Node SPA-fallback server
- **API:** Java 21 + Spring Boot 3.x modular monolith
- **Authentication:** Spring Security + JWT
- **Application database:** Supabase-hosted PostgreSQL
- **Application schema migrations:** Flyway
- **Clinical interoperability:** HL7 FHIR R4 through HAPI FHIR; the deployed demo uses the public HAPI FHIR R4 test server and local/integration testing can run the repository's HAPI container
- **Responder phone verification:** Android SMS Relay foreground-service app using the phone's SIM
- **Synthetic patient data:** Synthea / fictional demo data only
- **Hosting:** Render free-tier web services for the API and responder site
- **Local supporting services:** Docker Compose
- **CI / APK builds:** GitHub Actions

Supabase is used as managed PostgreSQL. It does **not** replace Spring Boot, Spring Security, Flyway, or the REST API. Mobile/web clients must never query the Supabase database directly and must never receive database credentials or a service-role key.

## Current deployed demo

The final capstone demo is internet-accessible and does not require the patient
and responder phones to share a Wi-Fi network.

- **API:** `https://medipass-api-aldrinjk.onrender.com`
- **Responder:** `https://medipass-responder-web-aldrinjk.onrender.com`
- **Patient app:** standalone Android APK produced by
  `.github/workflows/mobile-apk.yml`, with the public API URL baked into the build
- **SMS transport:** the separate MediPass Android SMS Relay polls the public API
  and sends responder OTP messages through the relay phone's active SIM
- **FHIR:** the public capstone deployment points to
  `https://hapi.fhir.org/baseR4`; only synthetic/fictional data may be used

The old Render static responder service
`medipass-responder-aldrinjk.onrender.com` is not the supported QR target.
The Node responder service above is required because it provides SPA fallback
for direct `/passes/:token` links.

## High-level data flow

```text
Patient Expo App ---------------------> Spring Boot API
                                              |
                         +--------------------+--------------------+
                         |                                         |
                         v                                         v
              Supabase PostgreSQL                         HAPI FHIR R4
       users / passes / token hashes /             Patient / AllergyIntolerance /
       sharing / refresh tokens / audit             MedicationStatement / Condition

QR contains only publicUrl
        |
        v
Normal phone camera -> Public Responder Web
                         |
                         +-> active pass without responder session: 428 verification required
                         +-> phone OTP or explicit emergency override
                         +-> GET /api/v1/public/passes/{token} with X-MediPass-Verification
                         +-> filtered emergency summary + audit/trace metadata
```

## Repository structure

```text
medipass-capstone/
├── apps/
│   ├── mobile/                  # Expo / React Native patient app
│   ├── responder-web/           # Public emergency viewer (React + Vite)
│   └── api/                     # Spring Boot modular monolith
├── data/
│   └── synthea/                 # Curated synthetic demo data
├── docs/
│   ├── api/openapi.yaml         # AUTHORITATIVE API contract
│   ├── architecture/
│   ├── fhir/
│   ├── testing/
│   └── team-handoffs/
├── infra/
│   ├── hapi-fhir/
│   ├── supabase/
│   └── docker-compose.yml
├── .github/workflows/
├── .env.example
├── CONTRIBUTING.md
└── README.md
```

Flyway migrations live in:

```text
apps/api/src/main/resources/db/migration/
```

## Team ownership

1. **Patient Mobile Experience & Clinical Profile** — Expo patient app, authentication screens, dashboard, demographics, allergies, medications, conditions, emergency contact, sharing preferences.
2. **Emergency Pass, QR & Public Responder Experience** — QR/pass workflow in the Expo app plus the separate browser-based responder website.
3. **Core Backend, Authentication, Supabase Persistence & Pass Security** — Spring Boot API, JWT security, Supabase PostgreSQL/JPA, Flyway, pass-token security and public filtering.
4. **FHIR Interoperability, Clinical Data & Synthetic Patients** — HAPI FHIR R4 mappings, clinical service boundary, FHIR bundle support, Synthea data.
5. **Audit, Admin, Integration, DevOps & Quality Engineering** — access history, admin endpoints, Supabase environment documentation, Expo development-build workflow, CI and end-to-end integration.

## API contract

`docs/api/openapi.yaml` is the **single source of truth** for the `/api/v1/...` contract. Do not rename endpoints, enum values, request fields, or response semantics without team-lead approval. Contract changes are OpenAPI-first.

Key shared pass behavior:

- `ShareCategory`: `DEMOGRAPHICS`, `ALLERGIES`, `MEDICATIONS`, `CONDITIONS`, `EMERGENCY_CONTACT`
- `PassStatus`: `ACTIVE`, `REVOKED`, `EXPIRED`
- The backend's stored sharing preferences are authoritative when a new pass is issued; stale/tampered client categories cannot enable additional data.
- Public pass endpoint returns `428` for an active pass that still needs responder verification, `200` after a valid short-lived responder session is supplied, `404` for an invalid token, and `410` for an expired or revoked pass.
- Phone OTP proves control of the supplied number, not the responder's legal name. Emergency override remains available but is explicitly logged as unverified.

## Database rules

- Supabase provides the hosted **PostgreSQL** application database.
- Spring Boot connects using a secure JDBC connection string stored only in environment/secrets configuration.
- Prefer the Supabase **Session pooler on port 5432** for persistent Spring Boot/JPA connections when direct connectivity is not suitable.
- Flyway owns application-schema evolution.
- Do not use Supabase Auth in this architecture.
- Do not use Supabase client SDKs for direct application-table access from Expo or the responder website.
- HAPI FHIR remains a separate clinical-data component and should not share the Flyway-managed application schema.

## Mobile build and demo rules

The final patient demo build is a standalone Android APK. Expo Go may still be
used for development, but it is not required by a recipient of the final APK.
The APK talks to the public Render API over HTTPS and uses real server-side data
when `EXPO_PUBLIC_USE_MOCKS=false`.

The SMS Relay is a separate Android app and should only be installed/configured
on the designated relay phone. Its shared key is never bundled into the patient
APK or committed to the repository.

## Branch strategy

- `main`: stable baseline / release branch
- `develop`: team integration branch
- `feature/*`: individual development branches
- Feature PRs target `develop`
- Tested release work moves from `develop` to `main`
- Final release candidates require green CI plus the physical-device acceptance
  checks in `docs/testing/demo-runbook.md`

## Data policy

**Never use real patient information.** Use Synthea or obviously fictional test profiles only. MediPass is a research/capstone prototype and is not a certified clinical product.
