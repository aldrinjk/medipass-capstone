package com.medipass.patient;

import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.patient.dto.UpdatePatientProfileRequest;

import java.util.UUID;

public interface ClinicalService {
    PatientProfileDto getPatientProfile(UUID userId);
    PatientProfileDto updatePatientProfile(UUID userId, UpdatePatientProfileRequest request);
}
