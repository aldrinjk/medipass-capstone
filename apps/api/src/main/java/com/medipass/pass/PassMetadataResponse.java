package com.medipass.pass;

import com.medipass.sharing.ShareCategory;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record PassMetadataResponse(
        UUID passId,
        PassStatus status,
        Instant expiresAt,
        Set<ShareCategory> categories,
        Instant createdAt,
        Instant revokedAt
) {
}
