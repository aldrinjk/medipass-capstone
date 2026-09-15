# MediPass API

Java 21 + Spring Boot 3.x modular-monolith backend.

## Responsibilities

- Spring Security + JWT authentication/authorization
- REST contract defined by `docs/api/openapi.yaml`
- Spring Data JPA persistence to Supabase-hosted PostgreSQL
- Flyway application-schema migrations
- secure emergency-pass token lifecycle
- integration boundaries for audit/admin and HAPI FHIR modules

## Important rules

- Supabase Auth is not used.
- Clients never query Supabase application tables directly.
- Flyway migrations belong in `src/main/resources/db/migration/`.
- HAPI FHIR clinical storage is separate from the Flyway-managed application schema.
- Never commit database credentials, JWT secrets, or real patient data.

## Milestone 1 local setup

Requirements:

- Java 21
- Maven 3.9+
- access to the team's Supabase PostgreSQL project

From `apps/api`, provide these server-side environment variables before startup:

```text
SUPABASE_DB_URL=jdbc:postgresql://<session-pooler-host>:5432/postgres?sslmode=require
SUPABASE_DB_USER=<database-user>
SUPABASE_DB_PASSWORD=<database-password>
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Use the Supabase Session pooler on port 5432 (or a suitable direct connection). Do not use the transaction pooler on port 6543 as the Hibernate/JPA datasource.

Run tests:

```bash
mvn test
```

Run the API against Supabase:

```bash
mvn spring-boot:run
```

Expected startup behavior:

1. Spring Boot starts on port `8080` unless `SERVER_PORT` overrides it.
2. The PostgreSQL datasource connects with SSL using the supplied Supabase JDBC URL.
3. Flyway applies `V1__baseline.sql` and records it in `flyway_schema_history`.
4. Hibernate validates the schema and does not mutate it (`ddl-auto=validate`).

The test profile uses an in-memory PostgreSQL-compatible H2 database so `mvn test` never requires production/team database credentials.
