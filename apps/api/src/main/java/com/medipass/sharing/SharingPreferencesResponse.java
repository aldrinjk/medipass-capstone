package com.medipass.sharing;

import java.util.Set;

public record SharingPreferencesResponse(
        Set<ShareCategory> categories
) {
}
