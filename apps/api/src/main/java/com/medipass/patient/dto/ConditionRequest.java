package com.medipass.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ConditionRequest(
        @NotBlank(message = "Condition name is required.")
        @Size(max = 120, message = "Condition name must be 120 characters or fewer.")
        String name,

        @Size(max = 60, message = "Status must be 60 characters or fewer.")
        String status,

        @Size(max = 300, message = "Notes must be 300 characters or fewer.")
        String notes
) {
}
