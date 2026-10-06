package com.medipass.admin;

import com.medipass.audit.AccessOutcome;

import java.time.Instant;
import java.util.UUID;

/**
 * Admin-facing access-log view. Includes request correlation and responder
 * verification metadata so support/ops can cross-reference an access attempt.
 * Never includes the raw public token, OTP, verification token, or clinical payload.
 */
public record AdminAccessLogResponse(
        UUID id,
        UUID passId,
        UUID userId,
        AccessOutcome outcome,
        String correlationId,
        String traceCode,
        String responderDevice,
        String responderName,
        String responderRole,
        String responderOrganization,
        String responderPhoneLast4,
        String verificationMethod,
        String verificationNote,
        Instant accessedAt
) {
}
