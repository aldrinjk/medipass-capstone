package com.medipass.pass;

import com.medipass.audit.AccessOutcome;
import com.medipass.audit.PassAccessLog;
import com.medipass.audit.PassAccessLogRepository;
import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import com.medipass.patient.ClinicalService;
import com.medipass.patient.dto.AllergyRequest;
import com.medipass.patient.dto.MedicationRequest;
import com.medipass.sharing.ShareCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PublicPassTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EmergencyPassRepository emergencyPassRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PassTokenService passTokenService;

    @Autowired
    private ClinicalService clinicalService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PassAccessLogRepository passAccessLogRepository;

    private UUID userId;

    @BeforeEach
    void setUp() {
        passAccessLogRepository.deleteAll();
        emergencyPassRepository.deleteAll();
        userRepository.deleteAll();

        User user = userRepository.save(new User("public-pass@medipass.test", "test-password-hash"));
        userId = user.getId();
    }

    @Test
    void validPublicPassNeedsNoLoginAndReturnsOnlySelectedCategories() throws Exception {
        clinicalService.createAllergy(
                userId,
                new AllergyRequest("Peanuts", "Hives", "Severe")
        );
        clinicalService.createMedication(
                userId,
                new MedicationRequest("Demo Medicine", "10 mg", "Daily")
        );

        String rawToken = "valid-public-token";
        savePass(
                rawToken,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Set.of(ShareCategory.ALLERGIES)
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories", containsInAnyOrder("ALLERGIES")))
                .andExpect(jsonPath("$.allergies[0].substance").value("Peanuts"))
                .andExpect(jsonPath("$.demographics").doesNotExist())
                .andExpect(jsonPath("$.medications").doesNotExist())
                .andExpect(jsonPath("$.conditions").doesNotExist())
                .andExpect(jsonPath("$.emergencyContact").doesNotExist())
                .andExpect(jsonPath("$.tokenHash").doesNotExist())
                .andExpect(jsonPath("$.userId").doesNotExist());
    }

    @Test
    void publicDemographicsDoNotExposeInternalPatientId() throws Exception {
        String rawToken = "safe-demographics-token";
        savePass(
                rawToken,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Set.of(ShareCategory.DEMOGRAPHICS)
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.demographics.fullName").exists())
                .andExpect(jsonPath("$.demographics.id").doesNotExist())
                .andExpect(jsonPath("$.userId").doesNotExist());
    }

    @Test
    void invalidPublicTokenReturns404() throws Exception {
        mockMvc.perform(get("/api/v1/public/passes/{token}", "token-that-does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PUBLIC_PASS_NOT_FOUND"));
    }

    @Test
    void expiredPublicPassReturns410() throws Exception {
        String rawToken = "expired-public-token";
        savePass(
                rawToken,
                Instant.now().minus(1, ChronoUnit.HOURS),
                Set.of(ShareCategory.ALLERGIES)
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("PUBLIC_PASS_EXPIRED"));
    }

    @Test
    void revokedPublicPassReturns410() throws Exception {
        String rawToken = "revoked-public-token";
        EmergencyPass saved = savePass(
                rawToken,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Set.of(ShareCategory.ALLERGIES)
        );

        jdbcTemplate.update(
                "UPDATE emergency_pass SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP WHERE id = ?",
                saved.getId()
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("PUBLIC_PASS_REVOKED"));
    }

    @Test
    void successfulPublicAccessCreatesSuccessAuditLog() throws Exception {
        String rawToken = "audit-success-token";
        EmergencyPass saved = savePass(
                rawToken,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Set.of(ShareCategory.ALLERGIES)
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isOk());

        PassAccessLog log = onlyAuditLog();
        assertEquals(AccessOutcome.SUCCESS, log.getOutcome());
        assertEquals(saved.getId(), log.getPassId());
        assertEquals(userId, log.getUserId());
        assertNotNull(log.getAccessedAt());
    }

    @Test
    void publicAccessEchoesSuppliedCorrelationIdIntoAuditLog() throws Exception {
        String rawToken = "audit-correlation-supplied-token";
        savePass(
                rawToken,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Set.of(ShareCategory.ALLERGIES)
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken)
                        .header("X-Correlation-Id", "responder-web-req-42"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Correlation-Id", "responder-web-req-42"));

        PassAccessLog log = onlyAuditLog();
        assertEquals("responder-web-req-42", log.getCorrelationId());
    }

    @Test
    void publicAccessGeneratesCorrelationIdWhenCallerSuppliesNone() throws Exception {
        String rawToken = "audit-correlation-generated-token";
        savePass(
                rawToken,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Set.of(ShareCategory.ALLERGIES)
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Correlation-Id"));

        PassAccessLog log = onlyAuditLog();
        assertNotNull(log.getCorrelationId());
    }

    @Test
    void invalidPublicAccessCreatesInvalidAuditLog() throws Exception {
        mockMvc.perform(get("/api/v1/public/passes/{token}", "invalid-audit-token"))
                .andExpect(status().isNotFound());

        PassAccessLog log = onlyAuditLog();
        assertEquals(AccessOutcome.INVALID, log.getOutcome());
        assertNull(log.getPassId());
        assertNull(log.getUserId());
        assertNotNull(log.getAccessedAt());
    }

    @Test
    void expiredPublicAccessCreatesExpiredAuditLog() throws Exception {
        String rawToken = "audit-expired-token";
        EmergencyPass saved = savePass(
                rawToken,
                Instant.now().minus(1, ChronoUnit.HOURS),
                Set.of(ShareCategory.ALLERGIES)
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isGone());

        PassAccessLog log = onlyAuditLog();
        assertEquals(AccessOutcome.EXPIRED, log.getOutcome());
        assertEquals(saved.getId(), log.getPassId());
        assertEquals(userId, log.getUserId());
        assertNotNull(log.getAccessedAt());
    }

    @Test
    void revokedPublicAccessCreatesRevokedAuditLog() throws Exception {
        String rawToken = "audit-revoked-token";
        EmergencyPass saved = savePass(
                rawToken,
                Instant.now().plus(2, ChronoUnit.DAYS),
                Set.of(ShareCategory.ALLERGIES)
        );

        jdbcTemplate.update(
                "UPDATE emergency_pass SET status = 'REVOKED', revoked_at = CURRENT_TIMESTAMP WHERE id = ?",
                saved.getId()
        );

        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isGone());

        PassAccessLog log = onlyAuditLog();
        assertEquals(AccessOutcome.REVOKED, log.getOutcome());
        assertEquals(saved.getId(), log.getPassId());
        assertEquals(userId, log.getUserId());
        assertNotNull(log.getAccessedAt());
    }

    private PassAccessLog onlyAuditLog() {
        List<PassAccessLog> logs = passAccessLogRepository.findAll();
        assertEquals(1, logs.size());
        return logs.getFirst();
    }

    private EmergencyPass savePass(
            String rawToken,
            Instant expiresAt,
            Set<ShareCategory> categories
    ) {
        EmergencyPass emergencyPass = new EmergencyPass(
                userId,
                passTokenService.hashToken(rawToken),
                expiresAt,
                categories
        );
        return emergencyPassRepository.saveAndFlush(emergencyPass);
    }
}
