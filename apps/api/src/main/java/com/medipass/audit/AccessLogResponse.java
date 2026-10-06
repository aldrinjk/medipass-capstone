package com.medipass.audit;

import java.time.Instant;
import java.util.UUID;

public record AccessLogResponse(
        UUID id,
        UUID passId,
        AccessOutcome outcome,
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
