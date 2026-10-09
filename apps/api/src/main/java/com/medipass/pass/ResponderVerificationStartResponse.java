package com.medipass.pass;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResponderVerificationStartResponse(
        UUID challengeId,
        String maskedPhone,
        Instant expiresAt,
        String deliveryMode,
        String developmentCode
) {
}
