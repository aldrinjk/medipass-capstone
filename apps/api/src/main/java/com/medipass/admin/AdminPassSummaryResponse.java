package com.medipass.admin;

import com.medipass.pass.PassStatus;
import com.medipass.sharing.ShareCategory;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

/**
 * Admin-facing pass view. Unlike the patient-facing PassMetadataResponse this
 * is cross-user, so it carries userId - never the raw token or its hash.
 */
public record AdminPassSummaryResponse(
        UUID passId,
        UUID userId,
        PassStatus status,
        Instant expiresAt,
        Set<ShareCategory> categories,
        Instant createdAt,
        Instant revokedAt
) {
}
