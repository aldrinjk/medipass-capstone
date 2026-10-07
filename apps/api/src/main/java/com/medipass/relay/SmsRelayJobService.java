package com.medipass.relay;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@ConditionalOnProperty(
        name = "medipass.responder-verification.provider",
        havingValue = "android-relay"
)
public class SmsRelayJobService {

    private static final List<SmsRelayJobStatus> EXPIRABLE_STATUSES = List.of(
            SmsRelayJobStatus.PENDING,
            SmsRelayJobStatus.CLAIMED,
            SmsRelayJobStatus.SENT
    );

    private final SmsRelayJobRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final String sharedKey;
    private final long claimSeconds;
    private final int maxDeliveryAttempts;

    public SmsRelayJobService(
            SmsRelayJobRepository repository,
            PasswordEncoder passwordEncoder,
            @Value("${medipass.sms-relay.shared-key:}") String sharedKey,
            @Value("${medipass.sms-relay.claim-seconds:45}") long claimSeconds,
            @Value("${medipass.sms-relay.max-delivery-attempts:3}") int maxDeliveryAttempts
    ) {
        if (sharedKey == null || sharedKey.length() < 32) {
            throw new IllegalStateException(
                    "SMS_RELAY_SHARED_KEY must be at least 32 characters when android-relay mode is enabled."
            );
        }
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.sharedKey = sharedKey;
        this.claimSeconds = Math.max(15, claimSeconds);
        this.maxDeliveryAttempts = Math.max(1, maxDeliveryAttempts);
    }

    @Transactional
    public void queueVerification(
            UUID challengeId,
            String destinationE164,
            Instant expiresAt
    ) {
        maintenance();

        String code = "%06d".formatted(secureRandom.nextInt(1_000_000));
        String message = "MediPass verification code: " + code
                + ". This code expires shortly. Do not share it.";

        repository.saveAndFlush(SmsRelayJob.pending(
                challengeId,
                destinationE164,
                message,
                passwordEncoder.encode(code),
                expiresAt
        ));
    }

    @Transactional
    public boolean verifyOtp(UUID challengeId, String code) {
        SmsRelayJob job = repository.findByChallengeId(challengeId).orElse(null);
        if (job == null || !job.canVerify(Instant.now()) || job.getOtpHash() == null) {
            return false;
        }

        if (!passwordEncoder.matches(code, job.getOtpHash())) {
            return false;
        }

        job.markVerified();
        return true;
    }

    @Transactional
    public Optional<SmsRelayJobResponse> claimNext(String providedKey) {
        requireAuthorized(providedKey);
        maintenance();

        Optional<SmsRelayJob> next = repository
                .findFirstByStatusAndExpiresAtAfterOrderByCreatedAtAsc(
                        SmsRelayJobStatus.PENDING,
                        Instant.now()
                );

        if (next.isEmpty()) {
            return Optional.empty();
        }

        SmsRelayJob job = next.get();
        job.claim(Instant.now());

        return Optional.of(new SmsRelayJobResponse(
                job.getId(),
                job.getDestinationE164(),
                job.getMessageBody(),
                job.getExpiresAt(),
                job.getClaimAttempts()
        ));
    }

    @Transactional
    public void acknowledgeSent(String providedKey, UUID jobId) {
        requireAuthorized(providedKey);
        SmsRelayJob job = repository.findById(jobId)
                .orElseThrow(SmsRelayJobNotFoundException::new);

        if (job.getStatus() == SmsRelayJobStatus.SENT
                || job.getStatus() == SmsRelayJobStatus.VERIFIED) {
            return;
        }

        if (job.getStatus() != SmsRelayJobStatus.CLAIMED) {
            throw new SmsRelayJobStateException(
                    "SMS relay job is not currently claimed."
            );
        }

        job.markSent();
    }

    @Transactional
    public void acknowledgeFailed(
            String providedKey,
            UUID jobId,
            String error
    ) {
        requireAuthorized(providedKey);
        SmsRelayJob job = repository.findById(jobId)
                .orElseThrow(SmsRelayJobNotFoundException::new);

        if (job.getStatus() == SmsRelayJobStatus.SENT
                || job.getStatus() == SmsRelayJobStatus.VERIFIED
                || job.getStatus() == SmsRelayJobStatus.FAILED
                || job.getStatus() == SmsRelayJobStatus.EXPIRED) {
            return;
        }

        if (job.getStatus() != SmsRelayJobStatus.CLAIMED) {
            throw new SmsRelayJobStateException(
                    "SMS relay job is not currently claimed."
            );
        }

        job.markFailure(error, maxDeliveryAttempts);
    }

    @Transactional(readOnly = true)
    public SmsRelayStatusResponse status(String providedKey) {
        requireAuthorized(providedKey);
        return new SmsRelayStatusResponse("READY", Instant.now());
    }

    private void maintenance() {
        Instant now = Instant.now();

        repository.findByExpiresAtBeforeAndStatusIn(now, EXPIRABLE_STATUSES)
                .forEach(SmsRelayJob::expire);

        Instant staleCutoff = now.minus(claimSeconds, ChronoUnit.SECONDS);
        repository.findByStatusAndClaimedAtBefore(
                        SmsRelayJobStatus.CLAIMED,
                        staleCutoff
                )
                .forEach(job -> job.markFailure(
                        "Relay claim timed out before acknowledgement.",
                        maxDeliveryAttempts
                ));
    }

    private void requireAuthorized(String providedKey) {
        if (providedKey == null) {
            throw new SmsRelayAuthenticationException();
        }

        byte[] expected = sharedKey.getBytes(StandardCharsets.UTF_8);
        byte[] actual = providedKey.getBytes(StandardCharsets.UTF_8);

        if (!MessageDigest.isEqual(expected, actual)) {
            throw new SmsRelayAuthenticationException();
        }
    }
}
