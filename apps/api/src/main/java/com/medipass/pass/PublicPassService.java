package com.medipass.pass;

import com.medipass.patient.ClinicalService;
import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.ConditionDto;
import com.medipass.patient.dto.EmergencyContactDto;
import com.medipass.patient.dto.MedicationDto;
import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.sharing.ShareCategory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class PublicPassService {

    private final EmergencyPassRepository repository;
    private final PassTokenService passTokenService;
    private final ClinicalService clinicalService;

    public PublicPassService(
            EmergencyPassRepository repository,
            PassTokenService passTokenService,
            ClinicalService clinicalService
    ) {
        this.repository = repository;
        this.passTokenService = passTokenService;
        this.clinicalService = clinicalService;
    }

    @Transactional(readOnly = true)
    public PublicPassResponse getPublicSummary(String rawToken) {
        EmergencyPass emergencyPass = resolveActivePass(rawToken);
        Set<ShareCategory> categories = emergencyPass.getCategories();

        PatientProfileDto demographics = categories.contains(ShareCategory.DEMOGRAPHICS)
                ? clinicalService.getPatientProfile(emergencyPass.getUserId())
                : null;

        List<AllergyDto> allergies = categories.contains(ShareCategory.ALLERGIES)
                ? clinicalService.getAllergies(emergencyPass.getUserId())
                : null;

        List<MedicationDto> medications = categories.contains(ShareCategory.MEDICATIONS)
                ? clinicalService.getMedications(emergencyPass.getUserId())
                : null;

        List<ConditionDto> conditions = categories.contains(ShareCategory.CONDITIONS)
                ? clinicalService.getConditions(emergencyPass.getUserId())
                : null;

        EmergencyContactDto emergencyContact = categories.contains(ShareCategory.EMERGENCY_CONTACT)
                ? clinicalService.getEmergencyContact(emergencyPass.getUserId())
                : null;

        return new PublicPassResponse(
                emergencyPass.getId(),
                emergencyPass.getExpiresAt(),
                categories,
                demographics,
                allergies,
                medications,
                conditions,
                emergencyContact
        );
    }

    @Transactional(readOnly = true)
    public EmergencyPass resolveActivePass(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new PublicPassNotFoundException();
        }

        String tokenHash = passTokenService.hashToken(rawToken);
        EmergencyPass emergencyPass = repository.findByTokenHash(tokenHash)
                .orElseThrow(PublicPassNotFoundException::new);

        if (emergencyPass.getStatus() == PassStatus.REVOKED) {
            throw new PublicPassGoneException(PassStatus.REVOKED);
        }

        if (emergencyPass.getStatus() == PassStatus.EXPIRED
                || !emergencyPass.getExpiresAt().isAfter(Instant.now())) {
            throw new PublicPassGoneException(PassStatus.EXPIRED);
        }

        return emergencyPass;
    }
}
