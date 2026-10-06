package com.medipass.pass;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record ResponderVerificationConfirmRequest(
        @NotNull UUID challengeId,
        @NotBlank
        @Pattern(regexp = "^\\d{4,10}$", message = "must contain 4 to 10 digits")
        String code
) {
}
