package com.medipass.pass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResponderEmergencyOverrideRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 80) String role,
        @Size(max = 120) String organization,
        @NotBlank @Size(max = 200) String reason
) {
}
