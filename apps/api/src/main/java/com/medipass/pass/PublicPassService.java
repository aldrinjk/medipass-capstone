package com.medipass.pass;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class PublicPassService {

    private final EmergencyPassRepository repository;
    private final PassTokenService passTokenService;

    public PublicPassService(
            EmergencyPassRepository repository,
            PassTokenService passTokenService
    ) {
        this.repository = repository;
        this.passTokenService = passTokenService;
    }

    @Transactional(readOnly = true)
    public EmergencyPass resolveActivePass(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new PublicPassNotFoundException();
        }

        String tokenHash = passTokenService.hashToken(rawToken);
        EmergencyPass emergencyPass = repository.findByTokenHash(tokenHash)
                .orElseThrow(PublicPassNotFoundException::new);

        if (emergencyPass.getStatus() == PassStatus.REVOKED) {
            throw new PublicPassGoneException(PassStatus.REVOKED);
        }

        if (emergencyPass.getStatus() == PassStatus.EXPIRED
                || !emergencyPass.getExpiresAt().isAfter(Instant.now())) {
            throw new PublicPassGoneException(PassStatus.EXPIRED);
        }

        return emergencyPass;
    }
}
