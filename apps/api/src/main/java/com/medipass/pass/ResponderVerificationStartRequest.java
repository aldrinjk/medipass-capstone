package com.medipass.pass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResponderVerificationStartRequest(
        @NotBlank @Size(max = 120) String name,
        @Size(max = 80) String role,
        @Size(max = 120) String organization,
        @NotBlank
        @Pattern(
                regexp = "^\\+[1-9]\\d{7,14}$",
                message = "must use international E.164 format, for example +919876543210"
        )
        String phone
) {
}
