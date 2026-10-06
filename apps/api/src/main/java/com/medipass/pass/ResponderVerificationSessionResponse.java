package com.medipass.pass;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ResponderVerificationSessionResponse(
        String verificationToken,
        ResponderVerificationMethod verificationMethod,
        String responderName,
        String maskedPhone,
        Instant expiresAt
) {
}
