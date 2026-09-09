package com.medipass.patient;

import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.AllergyRequest;
import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.patient.dto.UpdatePatientProfileRequest;

import java.util.List;
import java.util.UUID;

public interface ClinicalService {
    PatientProfileDto getPatientProfile(UUID userId);
    PatientProfileDto updatePatientProfile(UUID userId, UpdatePatientProfileRequest request);

    List<AllergyDto> getAllergies(UUID userId);
    AllergyDto createAllergy(UUID userId, AllergyRequest request);
    AllergyDto updateAllergy(UUID userId, UUID allergyId, AllergyRequest request);
    void deleteAllergy(UUID userId, UUID allergyId);
}
