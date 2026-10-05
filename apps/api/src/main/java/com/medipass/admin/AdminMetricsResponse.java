package com.medipass.admin;

import java.time.Instant;

public record AdminMetricsResponse(
        long totalUsers,
        long totalPasses,
        long activePasses,
        long revokedPasses,
        long expiredPasses,
        long totalAccessLogs,
        long successfulAccesses,
        long expiredAccessAttempts,
        long revokedAccessAttempts,
        long invalidAccessAttempts,
        Instant generatedAt
) {
}
