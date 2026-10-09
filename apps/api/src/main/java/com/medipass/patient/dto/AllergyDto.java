package com.medipass.patient.dto;

import java.util.UUID;

public record AllergyDto(
        UUID id,
        String substance,
        String reaction,
        String severity
) {
}
