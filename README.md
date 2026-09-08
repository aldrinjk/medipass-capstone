# MediPass Capstone

**MediPass** is a patient-controlled QR-based emergency health passport. A patient maintains a small emergency profile, chooses which categories may be shared, creates a time-limited emergency pass, and displays its QR code in the MediPass mobile app. A responder scans the QR with a normal phone camera and opens a public browser page without installing MediPass or creating an account. The backend validates the token, expiry, revocation status, and sharing scope before returning only permitted emergency information. Public access is audited.

## Locked architecture (Revision 2)

- **Patient app:** React Native + Expo + TypeScript
- **Navigation:** Expo Router
- **Early demos:** Expo Go is allowed for quick supervisor demonstrations
- **Long-term mobile development/testing:** Expo development builds / `expo-dev-client`
- **Public responder viewer:** React + TypeScript + Vite website
- **API:** Java 21 + Spring Boot 3.x modular monolith
- **Authentication:** Spring Security + JWT
- **Application database:** Supabase-hosted PostgreSQL
- **Application schema migrations:** Flyway
- **Clinical interoperability:** HAPI FHIR JPA Server using HL7 FHIR R4
- **Synthetic patient data:** Synthea
- **Local supporting services:** Docker Compose
- **CI:** GitHub Actions

Supabase is used as managed PostgreSQL. It does **not** replace Spring Boot, Spring Security, Flyway, or the REST API. Mobile/web clients must never query the Supabase database directly and must never receive database credentials or a service-role key.

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
Normal phone camera -> Public Responder Web -> GET /api/v1/public/passes/{token}
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

When implementation begins, Flyway migrations belong in:

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
- Public pass endpoint returns `200` for an active pass, `404` for an invalid token, and `410` for an expired or revoked pass.

## Database rules

- Supabase provides the hosted **PostgreSQL** application database.
- Spring Boot connects using a secure JDBC connection string stored only in environment/secrets configuration.
- Prefer the Supabase **Session pooler on port 5432** for persistent Spring Boot/JPA connections when direct connectivity is not suitable.
- Flyway owns application-schema evolution.
- Do not use Supabase Auth in this architecture.
- Do not use Supabase client SDKs for direct application-table access from Expo or the responder website.
- HAPI FHIR remains a separate clinical-data component and should not share the Flyway-managed application schema.

## Expo rules

Expo Go is useful for quick early development demonstrations but is not the final runtime assumption. The project should remain compatible with Expo development builds so custom native dependencies can be added later without redesigning the application.

## Branch strategy

- `main`: stable baseline / release branch
- `develop`: team integration branch
- `feature/*`: individual development branches
- Feature PRs target `develop`
- Tested release work moves from `develop` to `main`

## Data policy

**Never use real patient information.** Use Synthea or obviously fictional test profiles only. MediPass is a research/capstone prototype and is not a certified clinical product.
