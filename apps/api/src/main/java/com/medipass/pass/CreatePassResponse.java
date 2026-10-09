package com.medipass.pass;

import com.medipass.sharing.ShareCategory;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record CreatePassResponse(
        UUID passId,
        PassStatus status,
        Instant expiresAt,
        String publicUrl,
        Set<ShareCategory> categories
) {
}
