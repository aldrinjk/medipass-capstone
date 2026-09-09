package com.medipass.pass;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.ConditionDto;
import com.medipass.patient.dto.EmergencyContactDto;
import com.medipass.patient.dto.MedicationDto;
import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.sharing.ShareCategory;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record PublicPassResponse(
        UUID passId,
        Instant expiresAt,
        Set<ShareCategory> categories,
        PatientProfileDto demographics,
        List<AllergyDto> allergies,
        List<MedicationDto> medications,
        List<ConditionDto> conditions,
        EmergencyContactDto emergencyContact
) {
}
