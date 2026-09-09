package com.medipass.sharing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SharingPreferenceRepository extends JpaRepository<SharingPreference, UUID> {
}
