package com.medipass.sharing;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record SharingPreferencesRequest(
        @NotNull(message = "Categories are required.")
        Set<ShareCategory> categories
) {
}
