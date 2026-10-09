package com.medipass.pass;

import com.medipass.sharing.ShareCategory;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.Set;

public record CreatePassRequest(
        @NotNull(message = "Categories are required.")
        Set<ShareCategory> categories,

        @NotNull(message = "Expiry time is required.")
        @Future(message = "Expiry time must be in the future.")
        Instant expiresAt
) {
}
