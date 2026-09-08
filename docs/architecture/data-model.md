# MediPass Data Ownership — Revision 2

## Supabase PostgreSQL: application/security metadata

Core Flyway-managed tables are expected to include:

- `app_user`
- `refresh_token`
- `sharing_preference`
- `emergency_pass`
- `emergency_pass_scope`
- `pass_access_log`

Recommended rules:

- UUID primary keys
- UTC timestamps
- opaque public-pass token stored as a one-way hash where practical
- no clinical payload duplication unless a documented projection/cache is explicitly approved
- no real patient data

## HAPI FHIR R4: clinical source of truth

Clinical resources include:

- `Patient`
- `AllergyIntolerance`
- `MedicationStatement`
- `Condition`
- emergency-contact representation chosen and documented by the FHIR owner

## Important boundary

The Expo mobile app and responder website do **not** query Supabase directly. They call Spring Boot REST APIs. Spring Boot uses JPA/JDBC/Flyway for application metadata and the FHIR service layer for clinical information.

HAPI FHIR must not use the same Flyway-managed application schema.
