# Team Handoffs — Architecture Revision 2

The detailed DOCX handoff package for the five team members has been regenerated for the Expo + Supabase architecture.

Current ownership:

1. Patient Mobile Experience & Clinical Profile
2. Emergency Pass, QR & Public Responder Experience
3. Core Backend, Authentication, Supabase Persistence & Pass Security
4. FHIR Interoperability, Clinical Data & Synthetic Patients
5. Audit, Admin, Integration, DevOps & Quality Engineering

All handoffs use the same frozen API contract in `docs/api/openapi.yaml` and the same repository structure described in the root README.

Important shared rules:

- Expo/React Native for patient mobile client
- separate React/Vite public responder website
- Spring Boot is the only application backend
- Supabase is hosted PostgreSQL only
- Flyway owns app-schema migrations
- Spring Security + JWT owns authentication
- HAPI FHIR R4 owns clinical interoperability
- no direct frontend database access
- synthetic data only
