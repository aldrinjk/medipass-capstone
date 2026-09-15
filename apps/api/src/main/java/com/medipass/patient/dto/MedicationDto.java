package com.medipass.patient.dto;

import java.util.UUID;

public record MedicationDto(
        UUID id,
        String name,
        String dosage,
        String frequency
) {
}
