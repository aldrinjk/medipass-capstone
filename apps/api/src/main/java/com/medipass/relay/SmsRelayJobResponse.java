package com.medipass.relay;

import java.time.Instant;
import java.util.UUID;

public record SmsRelayJobResponse(
        UUID jobId,
        String destinationE164,
        String message,
        Instant expiresAt,
        int deliveryAttempt
) {
}
