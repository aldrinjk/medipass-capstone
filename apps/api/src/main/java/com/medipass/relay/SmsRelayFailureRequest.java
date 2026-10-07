package com.medipass.relay;

import jakarta.validation.constraints.Size;

public record SmsRelayFailureRequest(
        @Size(max = 160) String error
) {
}
