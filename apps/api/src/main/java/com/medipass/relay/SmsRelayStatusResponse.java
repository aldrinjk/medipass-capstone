package com.medipass.relay;

import java.time.Instant;

public record SmsRelayStatusResponse(
        String status,
        Instant serverTime
) {
}
