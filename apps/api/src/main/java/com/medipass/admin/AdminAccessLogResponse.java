package com.medipass.admin;

import com.medipass.audit.AccessOutcome;

import java.time.Instant;
import java.util.UUID;

/**
 * Admin-facing access-log view. Includes request correlation and trace metadata
 * so support/ops can cross-reference an access attempt. Never includes the raw
 * public token or clinical payload.
 */
public record AdminAccessLogResponse(
        UUID id,
        UUID passId,
        UUID userId,
        AccessOutcome outcome,
        String correlationId,
        String traceCode,
        String responderDevice,
        Instant accessedAt
) {
}
