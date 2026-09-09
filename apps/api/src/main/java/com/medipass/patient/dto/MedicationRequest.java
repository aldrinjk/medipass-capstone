package com.medipass.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedicationRequest(
        @NotBlank(message = "Medication name is required.")
        @Size(max = 120, message = "Medication name must be 120 characters or fewer.")
        String name,

        @Size(max = 120, message = "Dosage must be 120 characters or fewer.")
        String dosage,

        @Size(max = 120, message = "Frequency must be 120 characters or fewer.")
        String frequency
) {
}
