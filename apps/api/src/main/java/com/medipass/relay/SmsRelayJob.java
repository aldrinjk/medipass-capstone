package com.medipass.relay;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sms_relay_job")
public class SmsRelayJob {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "challenge_id", nullable = false, unique = true)
    private UUID challengeId;

    @Column(name = "destination_e164", length = 32)
    private String destinationE164;

    @Column(name = "destination_last4", nullable = false, length = 4)
    private String destinationLast4;

    @Column(name = "message_body", length = 240)
    private String messageBody;

    @Column(name = "otp_hash", length = 100)
    private String otpHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SmsRelayJobStatus status;

    @Column(name = "claim_attempts", nullable = false)
    private int claimAttempts;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "claimed_at")
    private Instant claimedAt;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @Column(name = "last_error", length = 200)
    private String lastError;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    protected SmsRelayJob() {
    }

    private SmsRelayJob(
            UUID challengeId,
            String destinationE164,
            String destinationLast4,
            String messageBody,
            String otpHash,
            Instant expiresAt
    ) {
        this.challengeId = challengeId;
        this.destinationE164 = destinationE164;
        this.destinationLast4 = destinationLast4;
        this.messageBody = messageBody;
        this.otpHash = otpHash;
        this.status = SmsRelayJobStatus.PENDING;
        this.expiresAt = expiresAt;
    }

    public static SmsRelayJob pending(
            UUID challengeId,
            String destinationE164,
            String messageBody,
            String otpHash,
            Instant expiresAt
    ) {
        String last4 = destinationE164.substring(destinationE164.length() - 4);
        return new SmsRelayJob(
                challengeId,
                destinationE164,
                last4,
                messageBody,
                otpHash,
                expiresAt
        );
    }

    public void claim(Instant now) {
        this.status = SmsRelayJobStatus.CLAIMED;
        this.claimedAt = now;
        this.claimAttempts++;
        this.lastError = null;
    }

    public void releaseStaleClaim() {
        this.status = SmsRelayJobStatus.PENDING;
        this.claimedAt = null;
        this.lastError = "Relay claim timed out before acknowledgement.";
    }

    public void markSent() {
        this.status = SmsRelayJobStatus.SENT;
        this.sentAt = Instant.now();
        this.claimedAt = null;
        this.lastError = null;
        clearDeliveryPayload();
    }

    public void markFailure(String error, int maxDeliveryAttempts) {
        this.claimedAt = null;
        this.lastError = sanitizeError(error);

        if (claimAttempts >= maxDeliveryAttempts || !expiresAt.isAfter(Instant.now())) {
            this.status = SmsRelayJobStatus.FAILED;
            clearSensitivePayload();
        } else {
            this.status = SmsRelayJobStatus.PENDING;
        }
    }

    public void expire() {
        this.status = SmsRelayJobStatus.EXPIRED;
        this.claimedAt = null;
        clearSensitivePayload();
    }

    public boolean canVerify(Instant now) {
        return expiresAt.isAfter(now)
                && otpHash != null
                && (status == SmsRelayJobStatus.CLAIMED || status == SmsRelayJobStatus.SENT);
    }

    public void markVerified() {
        this.status = SmsRelayJobStatus.VERIFIED;
        this.verifiedAt = Instant.now();
        this.claimedAt = null;
        clearSensitivePayload();
    }

    private void clearDeliveryPayload() {
        this.destinationE164 = null;
        this.messageBody = null;
    }

    private void clearSensitivePayload() {
        clearDeliveryPayload();
        this.otpHash = null;
    }

    private String sanitizeError(String error) {
        if (error == null || error.isBlank()) {
            return "SMS relay reported a delivery failure.";
        }
        String trimmed = error.trim();
        return trimmed.length() <= 200 ? trimmed : trimmed.substring(0, 200);
    }

    public UUID getId() {
        return id;
    }

    public UUID getChallengeId() {
        return challengeId;
    }

    public String getDestinationE164() {
        return destinationE164;
    }

    public String getDestinationLast4() {
        return destinationLast4;
    }

    public String getMessageBody() {
        return messageBody;
    }

    public String getOtpHash() {
        return otpHash;
    }

    public SmsRelayJobStatus getStatus() {
        return status;
    }

    public int getClaimAttempts() {
        return claimAttempts;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getClaimedAt() {
        return claimedAt;
    }

    public Instant getSentAt() {
        return sentAt;
    }

    public Instant getVerifiedAt() {
        return verifiedAt;
    }

    public String getLastError() {
        return lastError;
    }
}
