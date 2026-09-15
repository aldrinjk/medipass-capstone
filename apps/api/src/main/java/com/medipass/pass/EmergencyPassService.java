package com.medipass.pass;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class EmergencyPassService {

    private static final int MAX_TOKEN_GENERATION_ATTEMPTS = 5;

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
        GeneratedToken generatedToken = generateUniqueToken();

        EmergencyPass emergencyPass = new EmergencyPass(
                userId,
                generatedToken.tokenHash(),
                request.expiresAt(),
                request.categories()
        );

        EmergencyPass saved = repository.saveAndFlush(emergencyPass);
        String publicUrl = publicResponderWebBaseUrl + "/passes/" + generatedToken.rawToken();

        return new CreatePassResponse(
                saved.getId(),
                saved.getStatus(),
                saved.getExpiresAt(),
                publicUrl,
                saved.getCategories()
        );
    }

    @Transactional
    public List<PassMetadataResponse> listPasses(UUID userId) {
        Instant now = Instant.now();
        return repository.findAllByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(pass -> {
                    expireIfNeeded(pass, now);
                    return toMetadataResponse(pass);
                })
                .toList();
    }

    @Transactional
    public PassMetadataResponse getPass(UUID userId, UUID passId) {
        EmergencyPass pass = repository.findByIdAndUserId(passId, userId)
                .orElseThrow(PassNotFoundException::new);
        expireIfNeeded(pass, Instant.now());
        return toMetadataResponse(pass);
    }

    @Transactional
    public PassMetadataResponse revokePass(UUID userId, UUID passId) {
        EmergencyPass pass = repository.findByIdAndUserId(passId, userId)
                .orElseThrow(PassNotFoundException::new);

        Instant now = Instant.now();

        if (expireIfNeeded(pass, now)) {
            return toMetadataResponse(repository.saveAndFlush(pass));
        }

        pass.revoke(now);
        EmergencyPass saved = repository.saveAndFlush(pass);
        return toMetadataResponse(saved);
    }

    @Transactional(noRollbackFor = PassLifecycleException.class)
    public RotatePassResponse rotatePass(UUID userId, UUID passId) {
        EmergencyPass pass = repository.findByIdAndUserId(passId, userId)
                .orElseThrow(PassNotFoundException::new);

        Instant now = Instant.now();

        if (expireIfNeeded(pass, now)) {
            repository.saveAndFlush(pass);
            throw new PassLifecycleException("Expired passes cannot be rotated.");
        }

        if (pass.getStatus() != PassStatus.ACTIVE) {
            throw new PassLifecycleException("Only an active pass can be rotated.");
        }

        GeneratedToken generatedToken = generateUniqueToken();
        pass.rotateToken(generatedToken.tokenHash(), now);

        EmergencyPass saved = repository.saveAndFlush(pass);
        String publicUrl = publicResponderWebBaseUrl + "/passes/" + generatedToken.rawToken();

        return new RotatePassResponse(
                saved.getId(),
                saved.getStatus(),
                saved.getExpiresAt(),
                publicUrl,
                saved.getCategories()
        );
    }

    private GeneratedToken generateUniqueToken() {
        for (int attempt = 0; attempt < MAX_TOKEN_GENERATION_ATTEMPTS; attempt++) {
            String rawToken = passTokenService.generateToken();
            String tokenHash = passTokenService.hashToken(rawToken);
            if (!repository.existsByTokenHash(tokenHash)) {
                return new GeneratedToken(rawToken, tokenHash);
            }
        }
        throw new IllegalStateException("Unable to generate a unique emergency pass token.");
    }

    private boolean expireIfNeeded(EmergencyPass pass, Instant now) {
        if (pass.getStatus() == PassStatus.ACTIVE && !pass.getExpiresAt().isAfter(now)) {
            pass.expire(now);
            return true;
        }
        return false;
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

    private record GeneratedToken(String rawToken, String tokenHash) {
    }
}
