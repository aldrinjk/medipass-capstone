package com.medipass.fhir;

import ca.uhn.fhir.context.FhirContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medipass.admin.HapiSyntheaImportService;
import com.medipass.patient.HapiFhirClinicalService;
import com.medipass.patient.dto.AllergyRequest;
import com.medipass.patient.dto.ConditionRequest;
import com.medipass.patient.dto.EmergencyContactRequest;
import com.medipass.patient.dto.MedicationRequest;
import com.medipass.patient.dto.UpdatePatientProfileRequest;
import org.hl7.fhir.r4.model.Bundle;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.wait.strategy.Wait;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class HapiFhirClinicalServiceIT {

    @Container
    static final GenericContainer<?> HAPI = new GenericContainer<>(
            DockerImageName.parse("hapiproject/hapi:v7.4.0")
    )
            .withExposedPorts(8080)
            .waitingFor(
                    Wait.forHttp("/fhir/metadata")
                            .forStatusCode(200)
                            .withStartupTimeout(Duration.ofMinutes(4))
            );

    @Test
    void clinicalCrudAndBundleWorkAgainstRealHapiR4() {
        FhirContext context = FhirContext.forR4();
        var client = context.newRestfulGenericClient(baseUrl());
        var service = new HapiFhirClinicalService(client, context);
        UUID userId = UUID.randomUUID();

        var profile = service.updatePatientProfile(
                userId,
                new UpdatePatientProfileRequest(
                        "FHIR Demo Patient",
                        LocalDate.of(1995, 4, 12),
                        "female",
                        "+1-555-0100"
                )
        );
        assertThat(profile.fullName()).isEqualTo("FHIR Demo Patient");
        assertThat(service.getPatientProfile(userId).birthDate()).isEqualTo(LocalDate.of(1995, 4, 12));

        var allergy = service.createAllergy(
                userId,
                new AllergyRequest("Peanuts", "Hives", "Severe")
        );
        assertThat(service.getAllergies(userId))
                .extracting(a -> a.id())
                .contains(allergy.id());

        var medication = service.createMedication(
                userId,
                new MedicationRequest("Epinephrine", "0.3 mg", "As needed")
        );
        assertThat(service.getMedications(userId))
                .extracting(m -> m.id())
                .contains(medication.id());

        var condition = service.createCondition(
                userId,
                new ConditionRequest("Asthma", "active", "Synthetic demo condition")
        );
        assertThat(service.getConditions(userId))
                .extracting(c -> c.id())
                .contains(condition.id());

        var contact = service.updateEmergencyContact(
                userId,
                new EmergencyContactRequest("Demo Contact", "Parent", "+1-555-0101")
        );
        assertThat(contact.name()).isEqualTo("Demo Contact");
        assertThat(service.getEmergencyContact(userId).phone()).isEqualTo("+1-555-0101");

        String bundleJson = service.getFhirBundleJson(userId);
        Bundle bundle = (Bundle) context.newJsonParser().parseResource(bundleJson);
        assertThat(bundle.getType()).isEqualTo(Bundle.BundleType.COLLECTION);
        assertThat(bundle.getEntry()).hasSizeGreaterThanOrEqualTo(4);

        service.updateAllergy(
                userId,
                allergy.id(),
                new AllergyRequest("Peanuts", "Anaphylaxis", "Severe")
        );
        assertThat(service.getAllergies(userId).getFirst().reaction()).isEqualTo("Anaphylaxis");

        service.deleteMedication(userId, medication.id());
        assertThat(service.getMedications(userId)).isEmpty();
    }

    @Test
    void syntheaImporterPersistsSyntheticResourcesToHapi() throws Exception {
        FhirContext context = FhirContext.forR4();
        var client = context.newRestfulGenericClient(baseUrl());
        var importer = new HapiSyntheaImportService(client, context);

        var payload = new ObjectMapper().readTree("""
                {
                  "resourceType": "Patient",
                  "name": [{"text": "Synthetic Import Patient"}],
                  "gender": "unknown"
                }
                """);

        var result = importer.importSyntheticPatients(payload);
        assertThat(result.resourcesReceived()).isEqualTo(1);
        assertThat(result.status()).isEqualTo("IMPORTED");
    }

    private static String baseUrl() {
        return "http://" + HAPI.getHost() + ":" + HAPI.getMappedPort(8080) + "/fhir";
    }
}
