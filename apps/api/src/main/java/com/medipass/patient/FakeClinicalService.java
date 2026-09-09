package com.medipass.patient;

import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.AllergyRequest;
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
        if (!allergies.containsKey(allergyId)) {
            throw new ClinicalResourceNotFoundException("Allergy not found.");
        }
        AllergyDto updated = toAllergy(allergyId, request);
        allergies.put(allergyId, updated);
        return updated;
    }

    @Override
    public void deleteAllergy(UUID userId, UUID allergyId) {
        AllergyDto removed = allergiesFor(userId).remove(allergyId);
        if (removed == null) {
            throw new ClinicalResourceNotFoundException("Allergy not found.");
        }
    }

    private Map<UUID, AllergyDto> allergiesFor(UUID userId) {
        return allergiesByUser.computeIfAbsent(userId, id -> new ConcurrentHashMap<>());
    }

    private AllergyDto toAllergy(UUID id, AllergyRequest request) {
        return new AllergyDto(
                id,
                request.substance().trim(),
                normalize(request.reaction()),
                normalize(request.severity())
        );
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
