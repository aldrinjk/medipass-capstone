# Architecture Decision Log

## ADR-001: Modular monolith
One Spring Boot API rather than five microservices.

## ADR-002: FHIR version
Core implementation uses HL7 FHIR R4 (4.0.1).

## ADR-003: Clinical source of truth
Clinical data is stored in HAPI FHIR; app DB stores identity/security/pass/audit metadata.
