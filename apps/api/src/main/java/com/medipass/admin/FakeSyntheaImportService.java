package com.medipass.admin;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.stereotype.Service;

/**
 * Temporary adapter (see SyntheaImportService). Accepts a FHIR Bundle-shaped
 * payload (or a bare array/single resource) and reports how many resources
 * it saw, without writing anything to a clinical store - there isn't one
 * wired up yet. Never inspects clinical field values, only structure, so it
 * stays agnostic to whatever resource shapes M4's real FHIR mapping ends up
 * using.
 */
@Service
public class FakeSyntheaImportService implements SyntheaImportService {

    @Override
    public SyntheaImportResponse importSyntheticPatients(JsonNode payload) {
        int resourceCount = countResources(payload);

        return new SyntheaImportResponse(
                resourceCount,
                "ACCEPTED_NOT_PERSISTED",
                "Received " + resourceCount + " synthetic resource(s). No HAPI FHIR-backed clinical "
                        + "store is wired up yet (pending the FHIR module) - nothing was persisted."
        );
    }

    private int countResources(JsonNode payload) {
        if (payload == null || payload.isNull() || payload.isMissingNode()) {
            return 0;
        }
        if (payload.has("entry") && payload.get("entry").isArray()) {
            return payload.get("entry").size();
        }
        if (payload.isArray()) {
            return payload.size();
        }
        return 1;
    }
}
