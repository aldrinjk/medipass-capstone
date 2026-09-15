package com.medipass.sharing;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.Set;
import java.util.UUID;

@Service
public class SharingPreferencesService {

    private final SharingPreferenceRepository repository;

    public SharingPreferencesService(SharingPreferenceRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public SharingPreferencesResponse getPreferences(UUID userId) {
        SharingPreference preference = repository.findById(userId)
                .orElseGet(() -> repository.save(new SharingPreference(userId)));
        return toResponse(preference);
    }

    @Transactional
    public SharingPreferencesResponse updatePreferences(UUID userId, SharingPreferencesRequest request) {
        SharingPreference preference = repository.findById(userId)
                .orElseGet(() -> new SharingPreference(userId));

        Set<ShareCategory> categories = request.categories();
        preference.update(
                categories.contains(ShareCategory.DEMOGRAPHICS),
                categories.contains(ShareCategory.ALLERGIES),
                categories.contains(ShareCategory.MEDICATIONS),
                categories.contains(ShareCategory.CONDITIONS),
                categories.contains(ShareCategory.EMERGENCY_CONTACT)
        );

        return toResponse(repository.save(preference));
    }

    private SharingPreferencesResponse toResponse(SharingPreference preference) {
        EnumSet<ShareCategory> categories = EnumSet.noneOf(ShareCategory.class);
        if (preference.isDemographics()) categories.add(ShareCategory.DEMOGRAPHICS);
        if (preference.isAllergies()) categories.add(ShareCategory.ALLERGIES);
        if (preference.isMedications()) categories.add(ShareCategory.MEDICATIONS);
        if (preference.isConditions()) categories.add(ShareCategory.CONDITIONS);
        if (preference.isEmergencyContact()) categories.add(ShareCategory.EMERGENCY_CONTACT);
        return new SharingPreferencesResponse(categories);
    }
}
