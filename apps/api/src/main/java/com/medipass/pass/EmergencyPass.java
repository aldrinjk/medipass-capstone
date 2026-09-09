package com.medipass.pass;

import com.medipass.sharing.ShareCategory;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "emergency_pass")
public class EmergencyPass {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PassStatus status = PassStatus.ACTIVE;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private Instant updatedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "emergency_pass_scope",
            joinColumns = @JoinColumn(name = "pass_id")
    )
    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 40)
    private Set<ShareCategory> categories = EnumSet.noneOf(ShareCategory.class);

    protected EmergencyPass() {
    }

    public EmergencyPass(
            UUID userId,
            String tokenHash,
            Instant expiresAt,
            Set<ShareCategory> categories
    ) {
        this.userId = userId;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
        this.categories = categories == null || categories.isEmpty()
                ? EnumSet.noneOf(ShareCategory.class)
                : EnumSet.copyOf(categories);
        this.status = PassStatus.ACTIVE;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public PassStatus getStatus() {
        return status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public Set<ShareCategory> getCategories() {
        return Set.copyOf(categories);
    }
}
