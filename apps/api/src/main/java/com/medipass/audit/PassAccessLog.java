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

    @Column(name = "accessed_at", nullable = false, insertable = false, updatable = false)
    private Instant accessedAt;

    protected PassAccessLog() {
    }

    public PassAccessLog(UUID passId, UUID userId, AccessOutcome outcome, String correlationId) {
        this.passId = passId;
        this.userId = userId;
        this.outcome = outcome;
        this.correlationId = correlationId;
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

    public Instant getAccessedAt() {
        return accessedAt;
    }
}
