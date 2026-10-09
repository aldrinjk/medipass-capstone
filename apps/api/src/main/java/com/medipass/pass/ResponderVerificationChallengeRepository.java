package com.medipass.pass;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface ResponderVerificationChallengeRepository
        extends JpaRepository<ResponderVerificationChallenge, UUID> {

    Optional<ResponderVerificationChallenge> findByIdAndPassId(UUID id, UUID passId);

    Optional<ResponderVerificationChallenge> findByAccessTokenHashAndPassIdAndStatus(
            String accessTokenHash,
            UUID passId,
            ResponderVerificationStatus status
    );

    long deleteByStatusAndChallengeExpiresAtBefore(
            ResponderVerificationStatus status,
            Instant cutoff
    );
}
