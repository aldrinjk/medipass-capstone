package com.medipass.pass;

import com.medipass.audit.AccessOutcome;
import com.medipass.audit.PassAccessAuditService;
import com.medipass.patient.ClinicalService;
import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.ConditionDto;
import com.medipass.patient.dto.EmergencyContactDto;
import com.medipass.patient.dto.MedicationDto;
import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.sharing.ShareCategory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class PublicPassService {

    private static final Logger log = LoggerFactory.getLogger(PublicPassService.class);

    private final EmergencyPassRepository repository;
    private final PassTokenService passTokenService;
    private final ClinicalService clinicalService;
    private final PassAccessAuditService auditService;

    public PublicPassService(
            EmergencyPassRepository repository,
            PassTokenService passTokenService,
            ClinicalService clinicalService,
            PassAccessAuditService auditService
    ) {
        this.repository = repository;
        this.passTokenService = passTokenService;
        this.clinicalService = clinicalService;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public PublicPassResponse getPublicSummary(String rawToken) {
        EmergencyPass emergencyPass = resolveActivePass(rawToken);
        Set<ShareCategory> categories = emergencyPass.getCategories();

        PublicDemographicsResponse demographics = null;
        if (categories.contains(ShareCategory.DEMOGRAPHICS)) {
            PatientProfileDto profile = clinicalService.getPatientProfile(emergencyPass.getUserId());
            demographics = PublicDemographicsResponse.from(profile);
        }

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

        PublicPassResponse response = new PublicPassResponse(
                emergencyPass.getId(),
                emergencyPass.getExpiresAt(),
                categories,
                demographics,
                allergies,
                medications,
                conditions,
                emergencyContact
        );

        recordAuditSafely(
                emergencyPass.getId(),
                emergencyPass.getUserId(),
                AccessOutcome.SUCCESS
        );

        return response;
    }

    @Transactional(readOnly = true)
    public EmergencyPass resolveActivePass(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            recordAuditSafely(null, null, AccessOutcome.INVALID);
            throw new PublicPassNotFoundException();
        }

        String tokenHash = passTokenService.hashToken(rawToken);
        EmergencyPass emergencyPass = repository.findByTokenHash(tokenHash)
                .orElse(null);

        if (emergencyPass == null) {
            recordAuditSafely(null, null, AccessOutcome.INVALID);
            throw new PublicPassNotFoundException();
        }

        if (emergencyPass.getStatus() == PassStatus.REVOKED) {
            recordAuditSafely(
                    emergencyPass.getId(),
                    emergencyPass.getUserId(),
                    AccessOutcome.REVOKED
            );
            throw new PublicPassGoneException(PassStatus.REVOKED);
        }

        if (emergencyPass.getStatus() == PassStatus.EXPIRED
                || !emergencyPass.getExpiresAt().isAfter(Instant.now())) {
            recordAuditSafely(
                    emergencyPass.getId(),
                    emergencyPass.getUserId(),
                    AccessOutcome.EXPIRED
            );
            throw new PublicPassGoneException(PassStatus.EXPIRED);
        }

        return emergencyPass;
    }

    private void recordAuditSafely(UUID passId, UUID userId, AccessOutcome outcome) {
        try {
            auditService.record(passId, userId, outcome);
        } catch (RuntimeException ex) {
            // Emergency/public-pass behavior must remain deterministic even if
            // the audit store is temporarily unavailable. Never log raw tokens
            // or clinical data here.
            log.warn(
                    "Unable to persist public-pass audit outcome={} passId={}",
                    outcome,
                    passId,
                    ex
            );
        }
    }
}
