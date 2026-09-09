package com.medipass.pass;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class EmergencyPassService {

    private final EmergencyPassRepository repository;
    private final PassTokenService passTokenService;
    private final String publicResponderWebBaseUrl;

    public EmergencyPassService(
            EmergencyPassRepository repository,
            PassTokenService passTokenService,
            @Value("${PUBLIC_RESPONDER_WEB_BASE_URL:http://localhost:5173}") String publicResponderWebBaseUrl
    ) {
        this.repository = repository;
        this.passTokenService = passTokenService;
        this.publicResponderWebBaseUrl = trimTrailingSlash(publicResponderWebBaseUrl);
    }

    @Transactional
    public CreatePassResponse createPass(UUID userId, CreatePassRequest request) {
        String rawToken = passTokenService.generateToken();
        String tokenHash = passTokenService.hashToken(rawToken);

        EmergencyPass emergencyPass = new EmergencyPass(
                userId,
                tokenHash,
                request.expiresAt(),
                request.categories()
        );

        EmergencyPass saved = repository.saveAndFlush(emergencyPass);
        String publicUrl = publicResponderWebBaseUrl + "/passes/" + rawToken;

        return new CreatePassResponse(
                saved.getId(),
                saved.getStatus(),
                saved.getExpiresAt(),
                publicUrl,
                saved.getCategories()
        );
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:5173";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
