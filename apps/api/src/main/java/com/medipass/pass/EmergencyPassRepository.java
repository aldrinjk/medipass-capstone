package com.medipass.pass;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmergencyPassRepository extends JpaRepository<EmergencyPass, UUID> {
    List<EmergencyPass> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<EmergencyPass> findByIdAndUserId(UUID id, UUID userId);
    Optional<EmergencyPass> findByTokenHash(String tokenHash);
    boolean existsByTokenHash(String tokenHash);

    // Admin-facing (P5): cross-user search and dashboard metrics.
    List<EmergencyPass> findAllByStatus(PassStatus status, Sort sort);
    long countByStatus(PassStatus status);
}
