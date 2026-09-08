# MediPass Architecture — Revision 2

MediPass is a patient-controlled QR-based emergency health passport.

A patient uses the **Expo / React Native mobile app** to authenticate, maintain a synthetic emergency profile, choose which categories can be shared, create a time-limited emergency pass, and display its QR code. The QR contains only a secure public URL.

A responder scans the QR with a normal phone camera. The URL opens the separate **React + Vite responder website** in the browser. The responder does not need a MediPass account or mobile app.

Both clients communicate only with the **Java 21 Spring Boot REST API**. They do not query Supabase directly.

```text
Patient Expo App ---------------------> Spring Boot API
                                              |
                     +------------------------+------------------------+
                     |                                                 |
                     v                                                 v
          Supabase-hosted PostgreSQL                           HAPI FHIR R4
          application/security metadata                       clinical source of truth

QR publicUrl -> Responder Web -> GET /api/v1/public/passes/{token}
                                      |
                                      +-> token/expiry/revocation/scope validation
                                      +-> filtered clinical projection
                                      +-> access audit
```

## Application data

Supabase-hosted PostgreSQL stores application/security metadata such as:

- app users
- refresh-token/session metadata
- sharing preferences
- emergency passes
- emergency-pass scopes
- opaque public-token hashes
- application access/audit logs

The schema is managed by **Flyway** from the Spring Boot project.

## Clinical data

HAPI FHIR R4 is the clinical source of truth for resources such as:

- Patient
- AllergyIntolerance
- MedicationStatement
- Condition
- other specifically approved clinical resources

The Spring Boot FHIR service hides raw FHIR complexity from the mobile and responder clients.

## Authentication

Authentication is implemented using Spring Security + JWT. Supabase Auth is not used in this architecture.

## Expo

Expo Go may be used for quick early demonstrations. The real project must stay compatible with Expo development builds (`expo-dev-client`) so native dependencies can be added later without redesign.

## Data policy

Only Synthea or clearly fictional synthetic/demo patient data may be used. No real patient information is permitted.
