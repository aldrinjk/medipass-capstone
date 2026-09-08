# MediPass API

Java 21 + Spring Boot 3.x modular-monolith backend.

Responsibilities:

- Spring Security + JWT authentication/authorization
- REST contract defined by `docs/api/openapi.yaml`
- Spring Data JPA persistence to Supabase-hosted PostgreSQL
- Flyway application-schema migrations
- secure emergency-pass token lifecycle
- audit/admin modules
- integration with the HAPI FHIR service layer

Important rules:

- Supabase Auth is not used.
- Clients never query Supabase application tables directly.
- Flyway migrations belong in `src/main/resources/db/migration/`.
- HAPI FHIR clinical storage is separate from the Flyway-managed application schema.
