package com.medipass.sharing;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients/me/sharing-preferences")
public class SharingPreferencesController {

    private final SharingPreferencesService service;

    public SharingPreferencesController(SharingPreferencesService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<SharingPreferencesResponse> getPreferences(Authentication authentication) {
        return ResponseEntity.ok(service.getPreferences(userId(authentication)));
    }

    @PutMapping
    public ResponseEntity<SharingPreferencesResponse> updatePreferences(
            Authentication authentication,
            @Valid @RequestBody SharingPreferencesRequest request
    ) {
        return ResponseEntity.ok(service.updatePreferences(userId(authentication), request));
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
