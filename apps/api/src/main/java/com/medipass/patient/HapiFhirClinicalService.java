package com.medipass.patient;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.api.MethodOutcome;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import ca.uhn.fhir.rest.gclient.TokenClientParam;
import ca.uhn.fhir.rest.server.exceptions.BaseServerResponseException;
import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.AllergyRequest;
import com.medipass.patient.dto.ConditionDto;
import com.medipass.patient.dto.ConditionRequest;
import com.medipass.patient.dto.EmergencyContactDto;
import com.medipass.patient.dto.EmergencyContactRequest;
import com.medipass.patient.dto.MedicationDto;
import com.medipass.patient.dto.MedicationRequest;
import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.patient.dto.UpdatePatientProfileRequest;
import org.hl7.fhir.r4.model.AllergyIntolerance;
import org.hl7.fhir.r4.model.Annotation;
import org.hl7.fhir.r4.model.Bundle;
import org.hl7.fhir.r4.model.CodeableConcept;
import org.hl7.fhir.r4.model.Condition;
import org.hl7.fhir.r4.model.ContactPoint;
import org.hl7.fhir.r4.model.Extension;
import org.hl7.fhir.r4.model.HumanName;
import org.hl7.fhir.r4.model.Identifier;
import org.hl7.fhir.r4.model.MedicationStatement;
import org.hl7.fhir.r4.model.Patient;
import org.hl7.fhir.r4.model.Reference;
import org.hl7.fhir.r4.model.Resource;
import org.hl7.fhir.r4.model.StringType;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.function.Supplier;

@Service
@Profile("!test")
public class HapiFhirClinicalService implements ClinicalService {

    private static final String USER_IDENTIFIER_SYSTEM = "urn:medipass:user-id";
    private static final String RESOURCE_IDENTIFIER_SYSTEM = "urn:medipass:resource-id";
    private static final String GENDER_TEXT_URL =
            "https://medipass.local/fhir/StructureDefinition/gender-text";
    private static final String ALLERGY_SEVERITY_TEXT_URL =
            "https://medipass.local/fhir/StructureDefinition/allergy-severity-text";

    private final IGenericClient client;
    private final FhirContext fhirContext;

    public HapiFhirClinicalService(IGenericClient client, FhirContext fhirContext) {
        this.client = client;
        this.fhirContext = fhirContext;
    }

    @Override
    public PatientProfileDto getPatientProfile(UUID userId) {
        return withFhir(() -> toPatientDto(findOrCreatePatient(userId), userId));
    }

    @Override
    public PatientProfileDto updatePatientProfile(UUID userId, UpdatePatientProfileRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            patient.getName().clear();
            patient.addName(new HumanName().setText(request.fullName().trim()));
            patient.setBirthDate(request.birthDate() == null
                    ? null
                    : Date.from(request.birthDate().atStartOfDay(ZoneOffset.UTC).toInstant()));
            writeGender(patient, request.gender());

            patient.getTelecom().removeIf(t -> t.getSystem() == ContactPoint.ContactPointSystem.PHONE);
            String phone = normalize(request.phone());
            if (phone != null) {
                patient.addTelecom()
                        .setSystem(ContactPoint.ContactPointSystem.PHONE)
                        .setUse(ContactPoint.ContactPointUse.MOBILE)
                        .setValue(phone);
            }

            update(patient);
            return toPatientDto(patient, userId);
        });
    }

    @Override
    public List<AllergyDto> getAllergies(UUID userId) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            return searchByPatient("AllergyIntolerance", patientId(patient), AllergyIntolerance.class)
                    .stream()
                    .map(this::toAllergyDto)
                    .toList();
        });
    }

    @Override
    public AllergyDto createAllergy(UUID userId, AllergyRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            UUID appId = UUID.randomUUID();
            AllergyIntolerance resource = new AllergyIntolerance();
            resource.addIdentifier(appIdentifier(appId));
            resource.setPatient(patientReference(patient));
            applyAllergy(resource, request);
            create(resource);
            return toAllergyDto(resource);
        });
    }

    @Override
    public AllergyDto updateAllergy(UUID userId, UUID allergyId, AllergyRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            AllergyIntolerance resource = findOwnedResource(
                    "AllergyIntolerance", allergyId, AllergyIntolerance.class, patient
            );
            applyAllergy(resource, request);
            update(resource);
            return toAllergyDto(resource);
        });
    }

    @Override
    public void deleteAllergy(UUID userId, UUID allergyId) {
        withFhirVoid(() -> {
            Patient patient = findOrCreatePatient(userId);
            AllergyIntolerance resource = findOwnedResource(
                    "AllergyIntolerance", allergyId, AllergyIntolerance.class, patient
            );
            client.delete().resourceById(resource.getIdElement()).execute();
        });
    }

    @Override
    public List<MedicationDto> getMedications(UUID userId) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            return searchByPatient("MedicationStatement", patientId(patient), MedicationStatement.class)
                    .stream()
                    .map(this::toMedicationDto)
                    .toList();
        });
    }

    @Override
    public MedicationDto createMedication(UUID userId, MedicationRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            UUID appId = UUID.randomUUID();
            MedicationStatement resource = new MedicationStatement();
            resource.addIdentifier(appIdentifier(appId));
            resource.setSubject(patientReference(patient));
            resource.setStatus(MedicationStatement.MedicationStatementStatus.ACTIVE);
            applyMedication(resource, request);
            create(resource);
            return toMedicationDto(resource);
        });
    }

    @Override
    public MedicationDto updateMedication(UUID userId, UUID medicationId, MedicationRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            MedicationStatement resource = findOwnedResource(
                    "MedicationStatement", medicationId, MedicationStatement.class, patient
            );
            applyMedication(resource, request);
            update(resource);
            return toMedicationDto(resource);
        });
    }

    @Override
    public void deleteMedication(UUID userId, UUID medicationId) {
        withFhirVoid(() -> {
            Patient patient = findOrCreatePatient(userId);
            MedicationStatement resource = findOwnedResource(
                    "MedicationStatement", medicationId, MedicationStatement.class, patient
            );
            client.delete().resourceById(resource.getIdElement()).execute();
        });
    }

    @Override
    public List<ConditionDto> getConditions(UUID userId) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            return searchByPatient("Condition", patientId(patient), Condition.class)
                    .stream()
                    .map(this::toConditionDto)
                    .toList();
        });
    }

    @Override
    public ConditionDto createCondition(UUID userId, ConditionRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            UUID appId = UUID.randomUUID();
            Condition resource = new Condition();
            resource.addIdentifier(appIdentifier(appId));
            resource.setSubject(patientReference(patient));
            applyCondition(resource, request);
            create(resource);
            return toConditionDto(resource);
        });
    }

    @Override
    public ConditionDto updateCondition(UUID userId, UUID conditionId, ConditionRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            Condition resource = findOwnedResource("Condition", conditionId, Condition.class, patient);
            applyCondition(resource, request);
            update(resource);
            return toConditionDto(resource);
        });
    }

    @Override
    public void deleteCondition(UUID userId, UUID conditionId) {
        withFhirVoid(() -> {
            Patient patient = findOrCreatePatient(userId);
            Condition resource = findOwnedResource("Condition", conditionId, Condition.class, patient);
            client.delete().resourceById(resource.getIdElement()).execute();
        });
    }

    @Override
    public EmergencyContactDto getEmergencyContact(UUID userId) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            if (!patient.hasContact()) {
                return new EmergencyContactDto("", "", "");
            }

            Patient.ContactComponent contact = patient.getContactFirstRep();
            String name = contact.hasName() ? normalize(contact.getName().getText()) : "";
            String relationship = contact.hasRelationship()
                    ? normalize(contact.getRelationshipFirstRep().getText())
                    : "";
            String phone = contact.getTelecom().stream()
                    .filter(t -> t.getSystem() == ContactPoint.ContactPointSystem.PHONE)
                    .map(ContactPoint::getValue)
                    .filter(v -> v != null && !v.isBlank())
                    .findFirst()
                    .orElse("");

            return new EmergencyContactDto(
                    name == null ? "" : name,
                    relationship == null ? "" : relationship,
                    phone
            );
        });
    }

    @Override
    public EmergencyContactDto updateEmergencyContact(UUID userId, EmergencyContactRequest request) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            patient.getContact().clear();

            Patient.ContactComponent contact = patient.addContact();
            contact.setName(new HumanName().setText(request.name().trim()));
            contact.addRelationship(new CodeableConcept().setText(request.relationship().trim()));
            contact.addTelecom()
                    .setSystem(ContactPoint.ContactPointSystem.PHONE)
                    .setValue(request.phone().trim());

            update(patient);
            return new EmergencyContactDto(
                    request.name().trim(),
                    request.relationship().trim(),
                    request.phone().trim()
            );
        });
    }

    @Override
    public String getFhirBundleJson(UUID userId) {
        return withFhir(() -> {
            Patient patient = findOrCreatePatient(userId);
            String patientId = patientId(patient);

            Bundle bundle = new Bundle();
            bundle.setType(Bundle.BundleType.COLLECTION);
            bundle.setTimestamp(new java.util.Date());
            addEntry(bundle, patient);

            searchByPatient("AllergyIntolerance", patientId, AllergyIntolerance.class)
                    .forEach(resource -> addEntry(bundle, resource));
            searchByPatient("MedicationStatement", patientId, MedicationStatement.class)
                    .forEach(resource -> addEntry(bundle, resource));
            searchByPatient("Condition", patientId, Condition.class)
                    .forEach(resource -> addEntry(bundle, resource));

            return fhirContext.newJsonParser()
                    .setPrettyPrint(true)
                    .encodeResourceToString(bundle);
        });
    }

    private Patient findOrCreatePatient(UUID userId) {
        List<Patient> matches = searchByIdentifier(
                Patient.class,
                USER_IDENTIFIER_SYSTEM,
                userId.toString()
        );
        if (!matches.isEmpty()) {
            return matches.get(0);
        }

        Patient patient = new Patient();
        patient.addIdentifier()
                .setSystem(USER_IDENTIFIER_SYSTEM)
                .setValue(userId.toString());
        patient.addName().setText("Demo Patient");
        create(patient);
        return patient;
    }

    private void applyAllergy(AllergyIntolerance resource, AllergyRequest request) {
        resource.setCode(new CodeableConcept().setText(request.substance().trim()));
        resource.getReaction().clear();
        resource.getExtension().removeIf(e -> ALLERGY_SEVERITY_TEXT_URL.equals(e.getUrl()));

        String reactionText = normalize(request.reaction());
        String severityText = normalize(request.severity());
        if (reactionText != null || severityText != null) {
            AllergyIntolerance.AllergyIntoleranceReactionComponent reaction = resource.addReaction();
            if (reactionText != null) {
                reaction.addManifestation(new CodeableConcept().setText(reactionText));
            }
            if (severityText != null) {
                switch (severityText.toLowerCase(Locale.ROOT)) {
                    case "mild" -> reaction.setSeverity(AllergyIntolerance.AllergyIntoleranceSeverity.MILD);
                    case "moderate" -> reaction.setSeverity(AllergyIntolerance.AllergyIntoleranceSeverity.MODERATE);
                    case "severe" -> reaction.setSeverity(AllergyIntolerance.AllergyIntoleranceSeverity.SEVERE);
                    default -> resource.addExtension(
                            ALLERGY_SEVERITY_TEXT_URL,
                            new StringType(severityText)
                    );
                }
            }
        }
    }

    private void applyMedication(MedicationStatement resource, MedicationRequest request) {
        resource.setMedication(new CodeableConcept().setText(request.name().trim()));
        resource.getDosage().clear();

        String dosageText = normalize(request.dosage());
        String frequencyText = normalize(request.frequency());
        if (dosageText != null || frequencyText != null) {
            org.hl7.fhir.r4.model.Dosage dosage = resource.addDosage();
            if (dosageText != null) {
                dosage.setText(dosageText);
            }
            if (frequencyText != null) {
                dosage.getTiming().getCode().setText(frequencyText);
            }
        }
    }

    private void applyCondition(Condition resource, ConditionRequest request) {
        resource.setCode(new CodeableConcept().setText(request.name().trim()));

        String status = normalize(request.status());
        resource.setClinicalStatus(status == null ? null : new CodeableConcept().setText(status));

        resource.getNote().clear();
        String notes = normalize(request.notes());
        if (notes != null) {
            resource.addNote(new Annotation().setText(notes));
        }
    }

    private PatientProfileDto toPatientDto(Patient patient, UUID userId) {
        String fullName = patient.hasName()
                ? normalize(patient.getNameFirstRep().getText())
                : null;
        if (fullName == null) {
            fullName = "Demo Patient";
        }

        LocalDate birthDate = null;
        if (patient.getBirthDate() != null) {
            birthDate = patient.getBirthDate().toInstant()
                    .atZone(ZoneOffset.UTC)
                    .toLocalDate();
        }

        String phone = patient.getTelecom().stream()
                .filter(t -> t.getSystem() == ContactPoint.ContactPointSystem.PHONE)
                .map(ContactPoint::getValue)
                .filter(v -> v != null && !v.isBlank())
                .findFirst()
                .orElse(null);

        return new PatientProfileDto(userId, fullName, birthDate, readGender(patient), phone);
    }

    private AllergyDto toAllergyDto(AllergyIntolerance resource) {
        String reaction = null;
        String severity = null;

        if (resource.hasReaction()) {
            AllergyIntolerance.AllergyIntoleranceReactionComponent component =
                    resource.getReactionFirstRep();
            if (component.hasManifestation()) {
                reaction = normalize(component.getManifestationFirstRep().getText());
            }
            if (component.hasSeverity()) {
                severity = component.getSeverity().toCode();
            }
        }

        Extension severityExtension = resource.getExtensionByUrl(ALLERGY_SEVERITY_TEXT_URL);
        if (severityExtension != null
                && severityExtension.getValue() instanceof StringType stringType) {
            severity = stringType.getValue();
        }

        return new AllergyDto(
                appUuid(resource.getIdentifier()),
                resource.hasCode() ? resource.getCode().getText() : "",
                reaction,
                severity
        );
    }

    private MedicationDto toMedicationDto(MedicationStatement resource) {
        String name = "";
        if (resource.getMedication() instanceof CodeableConcept concept) {
            name = concept.getText();
        }

        String dosage = null;
        String frequency = null;
        if (resource.hasDosage()) {
            org.hl7.fhir.r4.model.Dosage d = resource.getDosageFirstRep();
            dosage = normalize(d.getText());
            if (d.hasTiming() && d.getTiming().hasCode()) {
                frequency = normalize(d.getTiming().getCode().getText());
            }
        }

        return new MedicationDto(appUuid(resource.getIdentifier()), name, dosage, frequency);
    }

    private ConditionDto toConditionDto(Condition resource) {
        String notes = resource.hasNote()
                ? normalize(resource.getNoteFirstRep().getText())
                : null;
        String status = resource.hasClinicalStatus()
                ? normalize(resource.getClinicalStatus().getText())
                : null;

        return new ConditionDto(
                appUuid(resource.getIdentifier()),
                resource.hasCode() ? resource.getCode().getText() : "",
                status,
                notes
        );
    }

    private void writeGender(Patient patient, String rawGender) {
        patient.getExtension().removeIf(e -> GENDER_TEXT_URL.equals(e.getUrl()));

        String gender = normalize(rawGender);
        if (gender == null) {
            patient.setGender(null);
            return;
        }

        switch (gender.toLowerCase(Locale.ROOT)) {
            case "male" -> patient.setGender(
                    org.hl7.fhir.r4.model.Enumerations.AdministrativeGender.MALE
            );
            case "female" -> patient.setGender(
                    org.hl7.fhir.r4.model.Enumerations.AdministrativeGender.FEMALE
            );
            case "other" -> patient.setGender(
                    org.hl7.fhir.r4.model.Enumerations.AdministrativeGender.OTHER
            );
            case "unknown" -> patient.setGender(
                    org.hl7.fhir.r4.model.Enumerations.AdministrativeGender.UNKNOWN
            );
            default -> {
                patient.setGender(org.hl7.fhir.r4.model.Enumerations.AdministrativeGender.UNKNOWN);
                patient.addExtension(GENDER_TEXT_URL, new StringType(gender));
            }
        }
    }

    private String readGender(Patient patient) {
        Extension extension = patient.getExtensionByUrl(GENDER_TEXT_URL);
        if (extension != null && extension.getValue() instanceof StringType stringType) {
            return stringType.getValue();
        }

        return patient.hasGender()
                ? patient.getGender().toCode()
                : null;
    }

    private <T extends Resource> T findOwnedResource(
            String resourceType,
            UUID appId,
            Class<T> type,
            Patient patient
    ) {
        List<T> resources = searchByIdentifier(
                type,
                RESOURCE_IDENTIFIER_SYSTEM,
                appId.toString()
        );
        if (resources.isEmpty()) {
            throw new ClinicalResourceNotFoundException(resourceType + " not found.");
        }

        T resource = resources.get(0);
        if (!patientId(patient).equals(referencedPatientId(resource))) {
            throw new ClinicalResourceNotFoundException(resourceType + " not found.");
        }
        return resource;
    }

    private String referencedPatientId(Resource resource) {
        Reference reference;
        if (resource instanceof AllergyIntolerance allergy) {
            reference = allergy.getPatient();
        } else if (resource instanceof MedicationStatement medication) {
            reference = medication.getSubject();
        } else if (resource instanceof Condition condition) {
            reference = condition.getSubject();
        } else {
            return null;
        }
        return reference == null ? null : reference.getReferenceElement().getIdPart();
    }

    private <T extends Resource> List<T> searchByPatient(
            String resourceType,
            String patientId,
            Class<T> type
    ) {
        return search(resourceType + "?patient=" + encode("Patient/" + patientId), type);
    }

    private <T extends Resource> List<T> searchByIdentifier(
            Class<T> type,
            String system,
            String value
    ) {
        Bundle bundle = client.search()
                .forResource(type)
                .where(new TokenClientParam("identifier").exactly().systemAndCode(system, value))
                .returnBundle(Bundle.class)
                .execute();

        List<T> resources = new ArrayList<>();
        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            if (type.isInstance(entry.getResource())) {
                resources.add(type.cast(entry.getResource()));
            }
        }
        return resources;
    }

    private <T extends Resource> List<T> search(String relativeSearchUrl, Class<T> type) {
        Bundle bundle = client.search()
                .byUrl(relativeSearchUrl)
                .returnBundle(Bundle.class)
                .execute();

        List<T> resources = new ArrayList<>();
        for (Bundle.BundleEntryComponent entry : bundle.getEntry()) {
            if (type.isInstance(entry.getResource())) {
                resources.add(type.cast(entry.getResource()));
            }
        }
        return resources;
    }

    private void create(Resource resource) {
        MethodOutcome outcome = client.create().resource(resource).execute();
        if (outcome.getId() != null) {
            resource.setId(outcome.getId().toUnqualifiedVersionless().getValue());
        }
    }

    private void update(Resource resource) {
        client.update().resource(resource).execute();
    }

    private Reference patientReference(Patient patient) {
        return new Reference("Patient/" + patientId(patient));
    }

    private String patientId(Patient patient) {
        String id = patient.getIdElement().getIdPart();
        if (id == null || id.isBlank()) {
            throw new ClinicalServiceUnavailableException(
                    "HAPI FHIR returned a Patient without an id."
            );
        }
        return id;
    }

    private Identifier appIdentifier(UUID id) {
        return new Identifier()
                .setSystem(RESOURCE_IDENTIFIER_SYSTEM)
                .setValue(id.toString());
    }

    private UUID appUuid(List<Identifier> identifiers) {
        return identifiers.stream()
                .filter(i -> RESOURCE_IDENTIFIER_SYSTEM.equals(i.getSystem()))
                .map(Identifier::getValue)
                .filter(v -> v != null && !v.isBlank())
                .map(UUID::fromString)
                .findFirst()
                .orElseThrow(() -> new ClinicalServiceUnavailableException(
                        "FHIR resource is missing its MediPass application identifier."
                ));
    }

    private void addEntry(Bundle bundle, Resource resource) {
        bundle.addEntry()
                .setFullUrl(resource.getIdElement().toUnqualifiedVersionless().getValue())
                .setResource(resource);
    }

    private String encode(String value) {
        // IGenericClient.search().byUrl(...) accepts the raw FHIR search
        // expression and performs URL encoding itself. Pre-encoding token
        // separators such as "|" causes them to be double-encoded.
        return value;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private <T> T withFhir(Supplier<T> action) {
        try {
            return action.get();
        } catch (ClinicalResourceNotFoundException | ClinicalServiceUnavailableException ex) {
            throw ex;
        } catch (BaseServerResponseException ex) {
            throw new ClinicalServiceUnavailableException(
                    "The clinical FHIR service rejected the request.",
                    ex
            );
        } catch (RuntimeException ex) {
            throw new ClinicalServiceUnavailableException(
                    "The clinical FHIR service is temporarily unavailable.",
                    ex
            );
        }
    }

    private void withFhirVoid(Runnable action) {
        withFhir(() -> {
            action.run();
            return null;
        });
    }
}
