package com.medipass.pass;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface EmergencyPassRepository extends JpaRepository<EmergencyPass, UUID> {
    List<EmergencyPass> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
}
