# MediPass Capstone

**MediPass** is a patient-controlled QR-based emergency health passport. Patients maintain a small synthetic/demo emergency profile, choose which categories may be shared, and create a time-limited QR pass. An emergency responder can scan the QR without an account; the server validates expiry/revocation/scope and returns only permitted information. Every successful access is logged.

## Architecture

- React + TypeScript + Vite web application
- Java 21 + Spring Boot 3.x modular-monolith API
- PostgreSQL app database with Flyway
- HAPI FHIR JPA Server using HL7 FHIR R4
- Separate PostgreSQL database/schema for HAPI FHIR
- Docker Compose for local development
- GitHub Actions for CI

## Team ownership

1. Patient Experience & Clinical Profile Frontend
2. Emergency Pass, QR & Public Responder Experience
3. Core Backend, Authentication, Authorization & Pass Security
4. FHIR Interoperability, Clinical Data & Synthetic Patients
5. Audit, Admin, Integration, DevOps & Quality Engineering

## API contract

The authoritative API definition is `docs/api/openapi.yaml`. **Do not rename endpoints or fields without team-lead approval.**

## Branch strategy

- `main`: protected release branch
- `develop`: integration branch
- `feature/*`: normal development branches
- PRs target `develop`; tested releases merge `develop` to `main`

## Data policy

No real patient data. Use Synthea or obviously fictional test data only.
