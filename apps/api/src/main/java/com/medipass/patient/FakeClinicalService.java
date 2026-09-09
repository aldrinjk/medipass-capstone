package com.medipass.patient;

import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.patient.dto.UpdatePatientProfileRequest;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class FakeClinicalService implements ClinicalService {

    private final Map<UUID, PatientProfileDto> profiles = new ConcurrentHashMap<>();

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

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
