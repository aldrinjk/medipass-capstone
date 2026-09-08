# Supabase PostgreSQL Setup

Supabase is used as the **hosted PostgreSQL database** for MediPass application/security metadata.

It does not replace Spring Boot, Spring Security, Flyway, or the REST API.

## Connection

Spring Boot should receive the JDBC connection through environment variables. Prefer the Supabase **Session pooler on port 5432** when direct connectivity is not suitable for the runtime. Require SSL.

Example shape only:

```text
SUPABASE_DB_URL=jdbc:postgresql://<session-pooler-host>:5432/postgres?sslmode=require
SUPABASE_DB_USER=<db-user>
SUPABASE_DB_PASSWORD=<db-password>
```

Never commit real values.

## Rules

- Expo and responder-web clients never query the database directly.
- Do not use Supabase Auth in the current architecture.
- Flyway remains authoritative for application schema changes.
- Do not use the frontend anon/service-role keys as a shortcut for app-table access.
- HAPI FHIR remains a separate clinical-data component and must not share the Flyway-managed application schema.

## Migrations

All app schema migrations live under:

```text
apps/api/src/main/resources/db/migration/
```

Example naming:

```text
V1__create_app_user.sql
V2__create_refresh_token.sql
V3__create_emergency_pass.sql
V4__create_pass_access_log.sql
```

Never edit a migration already applied to the shared Supabase environment. Add a new versioned migration instead.
