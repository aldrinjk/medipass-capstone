package com.medipass.patient.dto;

import java.util.UUID;

public record ConditionDto(
        UUID id,
        String name,
        String status,
        String notes
) {
}
