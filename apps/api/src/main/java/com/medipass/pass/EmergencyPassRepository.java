package com.medipass.pass;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.domain.Sort;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EmergencyPassRepository extends JpaRepository<EmergencyPass, UUID> {
    @EntityGraph(attributePaths = "categories")
List<EmergencyPass> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    Optional<EmergencyPass> findByIdAndUserId(UUID id, UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from EmergencyPass p where p.id = :id and p.userId = :userId")
    Optional<EmergencyPass> findByIdAndUserIdForUpdate(
            @Param("id") UUID id,
            @Param("userId") UUID userId
    );
    Optional<EmergencyPass> findByTokenHash(String tokenHash);
    boolean existsByTokenHash(String tokenHash);

    // Admin-facing (P5): cross-user search and dashboard metrics.
    List<EmergencyPass> findAllByStatus(PassStatus status, Sort sort);
    long countByStatus(PassStatus status);
}
