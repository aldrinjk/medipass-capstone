package com.medipass.sharing;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "sharing_preference")
public class SharingPreference {

    @Id
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private boolean demographics;

    @Column(nullable = false)
    private boolean allergies;

    @Column(nullable = false)
    private boolean medications;

    @Column(nullable = false)
    private boolean conditions;

    @Column(name = "emergency_contact", nullable = false)
    private boolean emergencyContact;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private Instant updatedAt;

    protected SharingPreference() {
    }

    public SharingPreference(UUID userId) {
        this.userId = userId;
    }

    public UUID getUserId() {
        return userId;
    }

    public boolean isDemographics() {
        return demographics;
    }

    public boolean isAllergies() {
        return allergies;
    }

    public boolean isMedications() {
        return medications;
    }

    public boolean isConditions() {
        return conditions;
    }

    public boolean isEmergencyContact() {
        return emergencyContact;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void update(
            boolean demographics,
            boolean allergies,
            boolean medications,
            boolean conditions,
            boolean emergencyContact
    ) {
        this.demographics = demographics;
        this.allergies = allergies;
        this.medications = medications;
        this.conditions = conditions;
        this.emergencyContact = emergencyContact;
        this.updatedAt = Instant.now();
    }
}
