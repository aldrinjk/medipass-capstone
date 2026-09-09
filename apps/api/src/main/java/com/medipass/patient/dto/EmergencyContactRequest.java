package com.medipass.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmergencyContactRequest(
        @NotBlank(message = "Emergency contact name is required.")
        @Size(max = 120, message = "Emergency contact name must be 120 characters or fewer.")
        String name,

        @NotBlank(message = "Relationship is required.")
        @Size(max = 80, message = "Relationship must be 80 characters or fewer.")
        String relationship,

        @NotBlank(message = "Phone is required.")
        @Size(max = 30, message = "Phone must be 30 characters or fewer.")
        String phone
) {
}
