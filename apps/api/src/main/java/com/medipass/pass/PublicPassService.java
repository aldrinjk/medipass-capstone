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
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class PublicPassService {

    private static final Logger log = LoggerFactory.getLogger(PublicPassService.class);
    private static final String UNKNOWN_DEVICE = "Unknown device · Browser";

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
        return getPublicSummary(rawToken, UNKNOWN_DEVICE);
    }

    @Transactional(readOnly = true)
    public PublicPassResponse getPublicSummary(String rawToken, String responderDevice) {
        String traceCode = newTraceCode();
        String normalizedDevice = normalizeDevice(responderDevice);
        EmergencyPass emergencyPass = resolveActivePass(rawToken, traceCode, normalizedDevice);
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

        recordAuditSafely(
                emergencyPass.getId(),
                emergencyPass.getUserId(),
                AccessOutcome.SUCCESS,
                traceCode,
                normalizedDevice
        );

        return new PublicPassResponse(
                emergencyPass.getId(),
                emergencyPass.getExpiresAt(),
                categories,
                demographics,
                allergies,
                medications,
                conditions,
                emergencyContact,
                traceCode,
                normalizedDevice
        );
    }

    @Transactional(readOnly = true)
    public EmergencyPass resolveActivePass(String rawToken) {
        return resolveActivePass(rawToken, newTraceCode(), UNKNOWN_DEVICE);
    }

    private EmergencyPass resolveActivePass(
            String rawToken,
            String traceCode,
            String responderDevice
    ) {
        if (rawToken == null || rawToken.isBlank()) {
            recordAuditSafely(
                    null,
                    null,
                    AccessOutcome.INVALID,
                    traceCode,
                    responderDevice
            );
            throw new PublicPassNotFoundException();
        }

        String tokenHash = passTokenService.hashToken(rawToken);
        EmergencyPass emergencyPass = repository.findByTokenHash(tokenHash)
                .orElse(null);

        if (emergencyPass == null) {
            recordAuditSafely(
                    null,
                    null,
                    AccessOutcome.INVALID,
                    traceCode,
                    responderDevice
            );
            throw new PublicPassNotFoundException();
        }

        if (emergencyPass.getStatus() == PassStatus.REVOKED) {
            recordAuditSafely(
                    emergencyPass.getId(),
                    emergencyPass.getUserId(),
                    AccessOutcome.REVOKED,
                    traceCode,
                    responderDevice
            );
            throw new PublicPassGoneException(PassStatus.REVOKED);
        }

        if (emergencyPass.getStatus() == PassStatus.EXPIRED
                || !emergencyPass.getExpiresAt().isAfter(Instant.now())) {
            recordAuditSafely(
                    emergencyPass.getId(),
                    emergencyPass.getUserId(),
                    AccessOutcome.EXPIRED,
                    traceCode,
                    responderDevice
            );
            throw new PublicPassGoneException(PassStatus.EXPIRED);
        }

        return emergencyPass;
    }

    private String newTraceCode() {
        String value = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 16)
                .toUpperCase(Locale.ROOT);
        return "MP-" + value;
    }

    private String normalizeDevice(String responderDevice) {
        if (responderDevice == null || responderDevice.isBlank()) {
            return UNKNOWN_DEVICE;
        }
        String trimmed = responderDevice.trim();
        return trimmed.length() <= 120 ? trimmed : trimmed.substring(0, 120);
    }

    private void recordAuditSafely(
            UUID passId,
            UUID userId,
            AccessOutcome outcome,
            String traceCode,
            String responderDevice
    ) {
        try {
            auditService.record(passId, userId, outcome, traceCode, responderDevice);
        } catch (RuntimeException ex) {
            // Emergency/public-pass behavior must remain deterministic even if
            // the audit store is temporarily unavailable. Never log raw tokens
            // or clinical data here.
            log.warn(
                    "Unable to persist public-pass audit outcome={} passId={} traceCode={}",
                    outcome,
                    passId,
                    traceCode,
                    ex
            );
        }
    }
}
