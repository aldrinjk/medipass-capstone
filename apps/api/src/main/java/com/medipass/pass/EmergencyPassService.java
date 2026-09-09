package com.medipass.pass;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
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

    @Transactional(readOnly = true)
    public List<PassMetadataResponse> listPasses(UUID userId) {
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toMetadataResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PassMetadataResponse getPass(UUID userId, UUID passId) {
        EmergencyPass pass = repository.findByIdAndUserId(passId, userId)
                .orElseThrow(PassNotFoundException::new);
        return toMetadataResponse(pass);
    }

    @Transactional
    public PassMetadataResponse revokePass(UUID userId, UUID passId) {
        EmergencyPass pass = repository.findByIdAndUserId(passId, userId)
                .orElseThrow(PassNotFoundException::new);

        Instant now = Instant.now();

        if (pass.getStatus() == PassStatus.ACTIVE && !pass.getExpiresAt().isAfter(now)) {
            pass.expire(now);
        } else {
            pass.revoke(now);
        }

        EmergencyPass saved = repository.saveAndFlush(pass);
        return toMetadataResponse(saved);
    }

    @Transactional
    public RotatePassResponse rotatePass(UUID userId, UUID passId) {
        EmergencyPass pass = repository.findByIdAndUserId(passId, userId)
                .orElseThrow(PassNotFoundException::new);

        Instant now = Instant.now();

        if (pass.getStatus() == PassStatus.ACTIVE && !pass.getExpiresAt().isAfter(now)) {
            pass.expire(now);
            repository.saveAndFlush(pass);
            throw new PassLifecycleException("Expired passes cannot be rotated.");
        }

        if (pass.getStatus() != PassStatus.ACTIVE) {
            throw new PassLifecycleException("Only an active pass can be rotated.");
        }

        String rawToken = passTokenService.generateToken();
        String newTokenHash = passTokenService.hashToken(rawToken);
        pass.rotateToken(newTokenHash, now);

        EmergencyPass saved = repository.saveAndFlush(pass);
        String publicUrl = publicResponderWebBaseUrl + "/passes/" + rawToken;

        return new RotatePassResponse(
                saved.getId(),
                saved.getStatus(),
                saved.getExpiresAt(),
                publicUrl,
                saved.getCategories()
        );
    }

    private PassMetadataResponse toMetadataResponse(EmergencyPass pass) {
        return new PassMetadataResponse(
                pass.getId(),
                pass.getStatus(),
                pass.getExpiresAt(),
                pass.getCategories(),
                pass.getCreatedAt(),
                pass.getRevokedAt()
        );
    }

    private String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:5173";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
