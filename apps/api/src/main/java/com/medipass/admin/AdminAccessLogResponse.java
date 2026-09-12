package com.medipass.admin;

import com.medipass.audit.AccessOutcome;

import java.time.Instant;
import java.util.UUID;

/**
 * Admin-facing access-log view. Includes the correlation id (absent from the
 * patient-facing AccessLogResponse) so support/ops can cross-reference an
 * access attempt with application logs. Never includes the raw public token.
 */
public record AdminAccessLogResponse(
        UUID id,
        UUID passId,
        UUID userId,
        AccessOutcome outcome,
        String correlationId,
        Instant accessedAt
) {
}
