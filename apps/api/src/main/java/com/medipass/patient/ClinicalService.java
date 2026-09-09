package com.medipass.patient;

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

import java.util.List;
import java.util.UUID;

public interface ClinicalService {
    PatientProfileDto getPatientProfile(UUID userId);
    PatientProfileDto updatePatientProfile(UUID userId, UpdatePatientProfileRequest request);

    List<AllergyDto> getAllergies(UUID userId);
    AllergyDto createAllergy(UUID userId, AllergyRequest request);
    AllergyDto updateAllergy(UUID userId, UUID allergyId, AllergyRequest request);
    void deleteAllergy(UUID userId, UUID allergyId);

    List<MedicationDto> getMedications(UUID userId);
    MedicationDto createMedication(UUID userId, MedicationRequest request);
    MedicationDto updateMedication(UUID userId, UUID medicationId, MedicationRequest request);
    void deleteMedication(UUID userId, UUID medicationId);

    List<ConditionDto> getConditions(UUID userId);
    ConditionDto createCondition(UUID userId, ConditionRequest request);
    ConditionDto updateCondition(UUID userId, UUID conditionId, ConditionRequest request);
    void deleteCondition(UUID userId, UUID conditionId);

    EmergencyContactDto getEmergencyContact(UUID userId);
    EmergencyContactDto updateEmergencyContact(UUID userId, EmergencyContactRequest request);
}
