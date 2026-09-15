package com.medipass.patient.dto;

import java.time.LocalDate;
import java.util.UUID;

public record PatientProfileDto(
        UUID id,
        String fullName,
        LocalDate birthDate,
        String gender,
        String phone
) {
}
