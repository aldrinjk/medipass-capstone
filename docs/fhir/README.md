# MediPass FHIR Service Handoff

This document records the implemented FHIR boundary for Milestone 4.

## Architecture

The Expo patient app and React responder site call Spring Boot only. Spring Boot uses `ClinicalService`, and the production/integration implementation is `HapiFhirClinicalService`.

The test profile keeps `FakeClinicalService` so fast unit tests do not require an external FHIR server. Real HAPI behavior is covered by `HapiFhirClinicalServiceIT`.

## Configuration

The API reads `HAPI_FHIR_BASE_URL`, defaulting locally to `http://localhost:8081/fhir`.

Start HAPI from the repository root:

```bash
docker compose -f infra/docker-compose.yml up -d hapi-fhir
curl http://localhost:8081/fhir/metadata
```

## Clinical mappings

| MediPass concept | FHIR R4 representation |
| --- | --- |
| Demographics | `Patient` |
| Emergency contact | `Patient.contact` |
| Allergies | `AllergyIntolerance` |
| Medications | `MedicationStatement` |
| Conditions | `Condition` |
| Emergency export | collection `Bundle` |

App-owned clinical resources use deterministic logical ids derived from MediPass UUIDs. This gives the application direct ownership-aware reads and updates without relying on search-index timing.

## ClinicalService methods

The stable boundary supports patient profile read/update, allergy CRUD, medication CRUD, condition CRUD, emergency-contact read/update, and patient-scoped FHIR Bundle export.

REST controllers continue returning MediPass DTOs; HAPI client types are not exposed to the mobile or responder clients.

## ShareCategory mapping

`DEMOGRAPHICS` calls `getPatientProfile`; `ALLERGIES` calls `getAllergies`; `MEDICATIONS` calls `getMedications`; `CONDITIONS` calls `getConditions`; and `EMERGENCY_CONTACT` calls `getEmergencyContact`.

Only categories stored on the emergency pass are assembled into the public responder response. Unselected categories remain absent.

## FHIR Bundle

`GET /api/v1/patients/me/fhir-bundle` returns an authenticated patient's FHIR R4 collection Bundle as `application/fhir+json`.

## Synthetic data

`HapiSyntheaImportService` is the non-test implementation behind `POST /api/v1/admin/synthea/import`. It accepts a FHIR Bundle, an array of resources, or a single resource and persists the synthetic resources to HAPI.

A deterministic fictional bundle is included at `data/synthea/medipass-demo-bundle.json`.

Real patient information must never be used.

## Error behavior

HAPI failures become `ClinicalServiceUnavailableException` and are returned as a controlled HTTP 503 with code `CLINICAL_SERVICE_UNAVAILABLE`. Missing or non-owned clinical resources use the existing clinical-resource 404 behavior.

## Audit relationship

The roadmap makes the PostgreSQL/Supabase application audit authoritative. FHIR `AuditEvent` is optional/best-effort and must not make public access depend on HAPI solely for auditing. MediPass therefore keeps emergency-pass access history in the application audit store.

## Verification

Run:

```bash
cd apps/api
mvn -B verify
```

`HapiFhirClinicalServiceIT` starts `hapiproject/hapi:v7.4.0` and verifies Patient persistence, allergy/medication/condition CRUD, emergency contact, FHIR Bundle generation, and synthetic import.

`PostgresFlywayIT` separately verifies Flyway/JPA behavior against real PostgreSQL.

## Reset

For a clean local FHIR demo store:

```bash
docker compose -f infra/docker-compose.yml down -v
docker compose -f infra/docker-compose.yml up -d hapi-fhir
```
