package com.medipass.admin;

public record SyntheaImportResponse(
        int resourcesReceived,
        String status,
        String message
) {
}
