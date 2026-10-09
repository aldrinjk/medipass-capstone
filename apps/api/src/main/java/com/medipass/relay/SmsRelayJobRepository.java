package com.medipass.relay;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SmsRelayJobRepository extends JpaRepository<SmsRelayJob, UUID> {

    Optional<SmsRelayJob> findByChallengeId(UUID challengeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<SmsRelayJob> findFirstByStatusAndExpiresAtAfterOrderByCreatedAtAsc(
            SmsRelayJobStatus status,
            Instant now
    );

    List<SmsRelayJob> findByStatusAndClaimedAtBefore(
            SmsRelayJobStatus status,
            Instant cutoff
    );

    List<SmsRelayJob> findByExpiresAtBeforeAndStatusIn(
            Instant cutoff,
            Collection<SmsRelayJobStatus> statuses
    );
}
