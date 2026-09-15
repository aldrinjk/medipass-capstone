package com.medipass.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AllergyRequest(
        @NotBlank(message = "Substance is required.")
        @Size(max = 120, message = "Substance must be 120 characters or fewer.")
        String substance,

        @Size(max = 200, message = "Reaction must be 200 characters or fewer.")
        String reaction,

        @Size(max = 40, message = "Severity must be 40 characters or fewer.")
        String severity
) {
}
