package com.medipass.pass;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmergencyPassRepository extends JpaRepository<EmergencyPass, UUID> {
    List<EmergencyPass> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<EmergencyPass> findByIdAndUserId(UUID id, UUID userId);
    Optional<EmergencyPass> findByTokenHash(String tokenHash);
}
