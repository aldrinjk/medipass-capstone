package com.medipass.admin;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Boundary for loading synthetic (Synthea-generated) FHIR patient data.
 * Production/integration profiles use the real HAPI FHIR-backed importer,
 * while the test profile uses an isolated non-persisting adapter.
 */
public interface SyntheaImportService {
    SyntheaImportResponse importSyntheticPatients(JsonNode payload);
}
