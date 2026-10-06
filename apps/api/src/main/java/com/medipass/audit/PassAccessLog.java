package com.medipass.audit;

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
@Table(name = "pass_access_log")
public class PassAccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "pass_id")
    private UUID passId;

    @Column(name = "user_id")
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccessOutcome outcome;

    @Column(name = "correlation_id", length = 64)
    private String correlationId;

    @Column(name = "trace_code", length = 32)
    private String traceCode;

    @Column(name = "responder_device", length = 120)
    private String responderDevice;

    @Column(name = "responder_name", length = 120)
    private String responderName;

    @Column(name = "responder_role", length = 80)
    private String responderRole;

    @Column(name = "responder_organization", length = 120)
    private String responderOrganization;

    @Column(name = "responder_phone_last4", length = 4)
    private String responderPhoneLast4;

    @Column(name = "verification_method", length = 32)
    private String verificationMethod;

    @Column(name = "verification_note", length = 200)
    private String verificationNote;

    @Column(name = "accessed_at", nullable = false, insertable = false, updatable = false)
    private Instant accessedAt;

    protected PassAccessLog() {
    }

    public PassAccessLog(UUID passId, UUID userId, AccessOutcome outcome, String correlationId) {
        this(passId, userId, outcome, correlationId, null, null);
    }

    public PassAccessLog(
            UUID passId,
            UUID userId,
            AccessOutcome outcome,
            String correlationId,
            String traceCode,
            String responderDevice
    ) {
        this(
                passId,
                userId,
                outcome,
                correlationId,
                traceCode,
                responderDevice,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    public PassAccessLog(
            UUID passId,
            UUID userId,
            AccessOutcome outcome,
            String correlationId,
            String traceCode,
            String responderDevice,
            String responderName,
            String responderRole,
            String responderOrganization,
            String responderPhoneLast4,
            String verificationMethod,
            String verificationNote
    ) {
        this.passId = passId;
        this.userId = userId;
        this.outcome = outcome;
        this.correlationId = correlationId;
        this.traceCode = traceCode;
        this.responderDevice = responderDevice;
        this.responderName = responderName;
        this.responderRole = responderRole;
        this.responderOrganization = responderOrganization;
        this.responderPhoneLast4 = responderPhoneLast4;
        this.verificationMethod = verificationMethod;
        this.verificationNote = verificationNote;
    }

    public UUID getId() {
        return id;
    }

    public UUID getPassId() {
        return passId;
    }

    public UUID getUserId() {
        return userId;
    }

    public AccessOutcome getOutcome() {
        return outcome;
    }

    public String getCorrelationId() {
        return correlationId;
    }

    public String getTraceCode() {
        return traceCode;
    }

    public String getResponderDevice() {
        return responderDevice;
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

    public String getResponderPhoneLast4() {
        return responderPhoneLast4;
    }

    public String getVerificationMethod() {
        return verificationMethod;
    }

    public String getVerificationNote() {
        return verificationNote;
    }

    public Instant getAccessedAt() {
        return accessedAt;
    }
}
