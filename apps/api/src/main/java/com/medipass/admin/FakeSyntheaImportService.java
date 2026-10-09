package com.medipass.admin;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * Test-profile Synthea adapter. Unit/controller tests use this lightweight
 * implementation so they do not need an external HAPI server. Production and
 * integration environments use HapiSyntheaImportService.
 */
@Service
@Profile("test")
public class FakeSyntheaImportService implements SyntheaImportService {

    @Override
    public SyntheaImportResponse importSyntheticPatients(JsonNode payload) {
        int resourceCount = countResources(payload);

        return new SyntheaImportResponse(
                resourceCount,
                "ACCEPTED_NOT_PERSISTED",
                "Received " + resourceCount + " synthetic resource(s) in the isolated test profile; "
                        + "nothing was persisted to an external HAPI server."
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
