package com.medipass.patient;

import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.AllergyRequest;
import com.medipass.patient.dto.ConditionDto;
import com.medipass.patient.dto.ConditionRequest;
import com.medipass.patient.dto.MedicationDto;
import com.medipass.patient.dto.MedicationRequest;
import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.patient.dto.UpdatePatientProfileRequest;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FakeClinicalService implements ClinicalService {

    private final Map<UUID, PatientProfileDto> profiles = new ConcurrentHashMap<>();
    private final Map<UUID, Map<UUID, AllergyDto>> allergiesByUser = new ConcurrentHashMap<>();
    private final Map<UUID, Map<UUID, MedicationDto>> medicationsByUser = new ConcurrentHashMap<>();
    private final Map<UUID, Map<UUID, ConditionDto>> conditionsByUser = new ConcurrentHashMap<>();

    @Override
    public PatientProfileDto getPatientProfile(UUID userId) {
        return profiles.computeIfAbsent(
                userId,
                id -> new PatientProfileDto(id, "Demo Patient", null, null, null)
        );
    }

    @Override
    public PatientProfileDto updatePatientProfile(UUID userId, UpdatePatientProfileRequest request) {
        PatientProfileDto updated = new PatientProfileDto(
                userId,
                request.fullName().trim(),
                request.birthDate(),
                normalize(request.gender()),
                normalize(request.phone())
        );
        profiles.put(userId, updated);
        return updated;
    }

    @Override
    public List<AllergyDto> getAllergies(UUID userId) {
        return new ArrayList<>(allergiesFor(userId).values());
    }

    @Override
    public AllergyDto createAllergy(UUID userId, AllergyRequest request) {
        UUID id = UUID.randomUUID();
        AllergyDto allergy = toAllergy(id, request);
        allergiesFor(userId).put(id, allergy);
        return allergy;
    }

    @Override
    public AllergyDto updateAllergy(UUID userId, UUID allergyId, AllergyRequest request) {
        Map<UUID, AllergyDto> allergies = allergiesFor(userId);
        if (!allergies.containsKey(allergyId)) throw new ClinicalResourceNotFoundException("Allergy not found.");
        AllergyDto updated = toAllergy(allergyId, request);
        allergies.put(allergyId, updated);
        return updated;
    }

    @Override
    public void deleteAllergy(UUID userId, UUID allergyId) {
        AllergyDto removed = allergiesFor(userId).remove(allergyId);
        if (removed == null) throw new ClinicalResourceNotFoundException("Allergy not found.");
    }

    @Override
    public List<MedicationDto> getMedications(UUID userId) {
        return new ArrayList<>(medicationsFor(userId).values());
    }

    @Override
    public MedicationDto createMedication(UUID userId, MedicationRequest request) {
        UUID id = UUID.randomUUID();
        MedicationDto medication = toMedication(id, request);
        medicationsFor(userId).put(id, medication);
        return medication;
    }

    @Override
    public MedicationDto updateMedication(UUID userId, UUID medicationId, MedicationRequest request) {
        Map<UUID, MedicationDto> medications = medicationsFor(userId);
        if (!medications.containsKey(medicationId)) throw new ClinicalResourceNotFoundException("Medication not found.");
        MedicationDto updated = toMedication(medicationId, request);
        medications.put(medicationId, updated);
        return updated;
    }

    @Override
    public void deleteMedication(UUID userId, UUID medicationId) {
        MedicationDto removed = medicationsFor(userId).remove(medicationId);
        if (removed == null) throw new ClinicalResourceNotFoundException("Medication not found.");
    }

    @Override
    public List<ConditionDto> getConditions(UUID userId) {
        return new ArrayList<>(conditionsFor(userId).values());
    }

    @Override
    public ConditionDto createCondition(UUID userId, ConditionRequest request) {
        UUID id = UUID.randomUUID();
        ConditionDto condition = toCondition(id, request);
        conditionsFor(userId).put(id, condition);
        return condition;
    }

    @Override
    public ConditionDto updateCondition(UUID userId, UUID conditionId, ConditionRequest request) {
        Map<UUID, ConditionDto> conditions = conditionsFor(userId);
        if (!conditions.containsKey(conditionId)) throw new ClinicalResourceNotFoundException("Condition not found.");
        ConditionDto updated = toCondition(conditionId, request);
        conditions.put(conditionId, updated);
        return updated;
    }

    @Override
    public void deleteCondition(UUID userId, UUID conditionId) {
        ConditionDto removed = conditionsFor(userId).remove(conditionId);
        if (removed == null) throw new ClinicalResourceNotFoundException("Condition not found.");
    }

    private Map<UUID, AllergyDto> allergiesFor(UUID userId) {
        return allergiesByUser.computeIfAbsent(userId, id -> new ConcurrentHashMap<>());
    }

    private Map<UUID, MedicationDto> medicationsFor(UUID userId) {
        return medicationsByUser.computeIfAbsent(userId, id -> new ConcurrentHashMap<>());
    }

    private Map<UUID, ConditionDto> conditionsFor(UUID userId) {
        return conditionsByUser.computeIfAbsent(userId, id -> new ConcurrentHashMap<>());
    }

    private AllergyDto toAllergy(UUID id, AllergyRequest request) {
        return new AllergyDto(id, request.substance().trim(), normalize(request.reaction()), normalize(request.severity()));
    }

    private MedicationDto toMedication(UUID id, MedicationRequest request) {
        return new MedicationDto(id, request.name().trim(), normalize(request.dosage()), normalize(request.frequency()));
    }

    private ConditionDto toCondition(UUID id, ConditionRequest request) {
        return new ConditionDto(id, request.name().trim(), normalize(request.status()), normalize(request.notes()));
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
