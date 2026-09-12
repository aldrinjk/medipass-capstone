package com.medipass.admin;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Boundary for loading synthetic (Synthea-generated) FHIR patient data into
 * the clinical store. Mirrors the ClinicalService pattern used in the
 * patient module: a fake adapter unblocks the admin endpoint contract today,
 * and M4 (FHIR Interoperability) replaces it with a real HAPI FHIR-backed
 * implementation once the fhir/ module lands, without the controller or the
 * frozen /api/v1/admin/synthea/import contract changing.
 */
public interface SyntheaImportService {
    SyntheaImportResponse importSyntheticPatients(JsonNode payload);
}
