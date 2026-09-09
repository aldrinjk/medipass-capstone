package com.medipass.audit;

import java.time.Instant;
import java.util.UUID;

public record AccessLogResponse(
        UUID id,
        UUID passId,
        AccessOutcome outcome,
        Instant accessedAt
) {
}
