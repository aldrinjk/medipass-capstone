package com.medipass.pass;

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
@Table(name = "responder_verification_challenge")
public class ResponderVerificationChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pass_id", nullable = false)
    private UUID passId;

    @Column(name = "responder_name", nullable = false, length = 120)
    private String responderName;

    @Column(name = "responder_role", length = 80)
    private String responderRole;

    @Column(name = "responder_organization", length = 120)
    private String responderOrganization;

    @Column(name = "phone_e164", length = 32)
    private String phoneE164;

    @Column(name = "phone_last4", length = 4)
    private String phoneLast4;

    @Column(name = "responder_device", nullable = false, length = 120)
    private String responderDevice;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ResponderVerificationStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_method", length = 32)
    private ResponderVerificationMethod verificationMethod;

    @Column(name = "verification_note", length = 200)
    private String verificationNote;

    @Column(name = "access_token_hash", length = 64)
    private String accessTokenHash;

    @Column(nullable = false)
    private int attempts;

    @Column(name = "challenge_expires_at", nullable = false)
    private Instant challengeExpiresAt;

    @Column(name = "session_expires_at")
    private Instant sessionExpiresAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    protected ResponderVerificationChallenge() {
    }

    private ResponderVerificationChallenge(
            UUID passId,
            String responderName,
            String responderRole,
            String responderOrganization,
            String phoneE164,
            String phoneLast4,
            String responderDevice,
            ResponderVerificationStatus status,
            ResponderVerificationMethod verificationMethod,
            String verificationNote,
            String accessTokenHash,
            Instant challengeExpiresAt,
            Instant sessionExpiresAt,
            Instant verifiedAt
    ) {
        this.passId = passId;
        this.responderName = responderName;
        this.responderRole = responderRole;
        this.responderOrganization = responderOrganization;
        this.phoneE164 = phoneE164;
        this.phoneLast4 = phoneLast4;
        this.responderDevice = responderDevice;
        this.status = status;
        this.verificationMethod = verificationMethod;
        this.verificationNote = verificationNote;
        this.accessTokenHash = accessTokenHash;
        this.challengeExpiresAt = challengeExpiresAt;
        this.sessionExpiresAt = sessionExpiresAt;
        this.verifiedAt = verifiedAt;
    }

    public static ResponderVerificationChallenge pending(
            UUID passId,
            String responderName,
            String responderRole,
            String responderOrganization,
            String phoneE164,
            String phoneLast4,
            String responderDevice,
            Instant challengeExpiresAt
    ) {
        return new ResponderVerificationChallenge(
                passId,
                responderName,
                responderRole,
                responderOrganization,
                phoneE164,
                phoneLast4,
                responderDevice,
                ResponderVerificationStatus.PENDING,
                null,
                null,
                null,
                challengeExpiresAt,
                null,
                null
        );
    }

    public static ResponderVerificationChallenge emergencyOverride(
            UUID passId,
            String responderName,
            String responderRole,
            String responderOrganization,
            String responderDevice,
            String verificationNote,
            String accessTokenHash,
            Instant sessionExpiresAt
    ) {
        Instant now = Instant.now();
        return new ResponderVerificationChallenge(
                passId,
                responderName,
                responderRole,
                responderOrganization,
                null,
                null,
                responderDevice,
                ResponderVerificationStatus.ACTIVE,
                ResponderVerificationMethod.EMERGENCY_OVERRIDE,
                verificationNote,
                accessTokenHash,
                now,
                sessionExpiresAt,
                now
        );
    }

    public void recordFailedAttempt(int maxAttempts) {
        this.attempts++;
        if (this.attempts >= maxAttempts) {
            this.status = ResponderVerificationStatus.LOCKED;
            // Once a challenge is locked, retain only the masked last four
            // digits; the full responder number is no longer needed.
            this.phoneE164 = null;
        }
    }

    public void activatePhoneVerification(
            String tokenHash,
            Instant sessionExpiry,
            String verificationNote
    ) {
        this.status = ResponderVerificationStatus.ACTIVE;
        this.verificationMethod = ResponderVerificationMethod.PHONE_OTP;
        this.verificationNote = verificationNote;
        this.accessTokenHash = tokenHash;
        this.sessionExpiresAt = sessionExpiry;
        this.verifiedAt = Instant.now();
        // The full number is needed only while the OTP challenge is pending.
        // Keep only the last four digits after verification.
        this.phoneE164 = null;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPassId() {
        return passId;
    }

    public String getResponderName() {
        return responderName;
    }

    public String getResponderRole() {
        return responderRole;
    }

    public String getResponderOrganization() {
        return responderOrganization;
    }

    public String getPhoneE164() {
        return phoneE164;
    }

    public String getPhoneLast4() {
        return phoneLast4;
    }

    public String getResponderDevice() {
        return responderDevice;
    }

    public ResponderVerificationStatus getStatus() {
        return status;
    }

    public int getAttempts() {
        return attempts;
    }

    public ResponderVerificationMethod getVerificationMethod() {
        return verificationMethod;
    }

    public String getVerificationNote() {
        return verificationNote;
    }

    public Instant getChallengeExpiresAt() {
        return challengeExpiresAt;
    }

    public Instant getSessionExpiresAt() {
        return sessionExpiresAt;
    }
}
