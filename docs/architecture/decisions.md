# Architecture Decision Log

## ADR-001: Spring Boot modular monolith
Use one Java 21 Spring Boot 3.x API rather than five microservices. The five team members own modules/features inside one backend contract.

## ADR-002: HL7 FHIR R4
Clinical interoperability uses HL7 FHIR R4 (4.0.1) through HAPI FHIR JPA.

## ADR-003: Clinical source of truth
Clinical data is stored behind the HAPI FHIR service boundary. Application/security metadata is stored separately in the application PostgreSQL database.

## ADR-004: Expo patient application
The authenticated patient experience is a React Native + Expo + TypeScript mobile app. Expo Go is allowed for quick early demos; Expo development builds are the long-term development/testing target.

## ADR-005: Public responder website
Emergency responders must not be required to install MediPass. QR codes open a separate mobile-first React + TypeScript + Vite web application in a normal browser.

## ADR-006: Supabase-hosted PostgreSQL
Supabase provides the hosted PostgreSQL application database. Supabase is database infrastructure only in this architecture: clients do not directly query it and Supabase Auth is not used.

## ADR-007: Flyway remains authoritative
Flyway remains the source of truth for application-schema migrations. Hibernate/JPA must not silently mutate the shared schema.

## ADR-008: API governance
`docs/api/openapi.yaml` is the authoritative `/api/v1/...` contract. Endpoint, JSON-field and enum changes require team-lead approval and an OpenAPI-first change.

## ADR-009: Synthetic data only
Use Synthea or clearly fictional data. Real patient health information is prohibited.
