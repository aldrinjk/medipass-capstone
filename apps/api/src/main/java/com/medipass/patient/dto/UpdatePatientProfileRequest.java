package com.medipass.patient.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdatePatientProfileRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 120, message = "Full name must be 120 characters or fewer.")
        String fullName,

        @Past(message = "Birth date must be in the past.")
        LocalDate birthDate,

        @Size(max = 40, message = "Gender must be 40 characters or fewer.")
        String gender,

        @Size(max = 30, message = "Phone must be 30 characters or fewer.")
        String phone
) {
}
