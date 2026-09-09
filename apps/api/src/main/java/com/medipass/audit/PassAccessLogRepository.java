package com.medipass.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PassAccessLogRepository extends JpaRepository<PassAccessLog, UUID> {
    List<PassAccessLog> findAllByUserIdOrderByAccessedAtDesc(UUID userId);
    Optional<PassAccessLog> findByIdAndUserId(UUID id, UUID userId);
}
