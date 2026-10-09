package com.medipass.admin;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.parser.IParser;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.medipass.patient.ClinicalServiceUnavailableException;
import org.hl7.fhir.instance.model.api.IBaseResource;
import org.hl7.fhir.r4.model.Bundle;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!test")
public class HapiSyntheaImportService implements SyntheaImportService {

    private final IGenericClient client;
    private final FhirContext fhirContext;

    public HapiSyntheaImportService(IGenericClient client, FhirContext fhirContext) {
        this.client = client;
        this.fhirContext = fhirContext;
    }

    @Override
    public SyntheaImportResponse importSyntheticPatients(JsonNode payload) {
        if (payload == null || payload.isNull() || payload.isMissingNode()) {
            return new SyntheaImportResponse(0, "IMPORTED", "No synthetic resources were supplied.");
        }

        try {
            int imported;
            if (payload.isArray()) {
                imported = 0;
                for (JsonNode node : payload) {
                    importSingle(node);
                    imported++;
                }
            } else {
                IParser parser = fhirContext.newJsonParser();
                IBaseResource parsed = parser.parseResource(payload.toString());
                if (parsed instanceof Bundle bundle) {
                    imported = importBundle(bundle);
                } else {
                    client.create().resource(parsed).execute();
                    imported = 1;
                }
            }

            return new SyntheaImportResponse(
                    imported,
                    "IMPORTED",
                    "Imported " + imported + " synthetic FHIR resource(s) into HAPI FHIR."
            );
        } catch (RuntimeException ex) {
            throw new ClinicalServiceUnavailableException("Synthetic FHIR import failed.", ex);
        }
    }

    private int importBundle(Bundle bundle) {
        int count = bundle.getEntry().size();
        if (bundle.getType() == Bundle.BundleType.TRANSACTION
                || bundle.getType() == Bundle.BundleType.BATCH) {
            client.transaction().withBundle(bundle).execute();
            return count;
        }

        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            if (entry.getResource() != null) {
                client.create().resource(entry.getResource()).execute();
            }
        }
        return count;
    }

    private void importSingle(JsonNode node) {
        IBaseResource resource = fhirContext.newJsonParser().parseResource(node.toString());
        client.create().resource(resource).execute();
    }
}
