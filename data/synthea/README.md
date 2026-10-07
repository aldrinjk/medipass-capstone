# Synthetic Patient Data

This directory is reserved for curated Synthea/demo data used by MediPass.

Rules:

- synthetic or obviously fictional data only
- no real patient information
- keep a small deterministic demo dataset for supervisor demonstrations
- document import steps and expected FHIR resource counts
- large generated datasets should not be committed unless the team explicitly agrees

Primary owner: Team Member 4, with integration support from Team Member 5.


## Curated demo bundle

`medipass-demo-bundle.json` is a small deterministic fictional FHIR R4 transaction Bundle for supervisor demonstrations. It contains one Patient plus one AllergyIntolerance, MedicationStatement, and Condition.

Start HAPI:

```bash
docker compose -f infra/docker-compose.yml up -d hapi-fhir
curl http://localhost:8081/fhir/metadata
```

The bundle can be imported through the admin endpoint once an ADMIN JWT is available:

```bash
curl -X POST http://localhost:8080/api/v1/admin/synthea/import \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  --data-binary @data/synthea/medipass-demo-bundle.json
```

It may also be posted directly to the local HAPI transaction endpoint for infrastructure-only verification:

```bash
curl -X POST http://localhost:8081/fhir \
  -H "Content-Type: application/fhir+json" \
  --data-binary @data/synthea/medipass-demo-bundle.json
```

This file is intentionally synthetic and must never be replaced with real patient information.
