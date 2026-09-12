package com.medipass.admin;

import com.medipass.audit.AccessOutcome;
import com.medipass.audit.PassAccessLog;
import com.medipass.audit.PassAccessLogRepository;
import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import com.medipass.pass.EmergencyPass;
import com.medipass.pass.EmergencyPassRepository;
import com.medipass.pass.PassTokenService;
import com.medipass.sharing.ShareCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmergencyPassRepository emergencyPassRepository;

    @Autowired
    private PassAccessLogRepository passAccessLogRepository;

    @Autowired
    private PassTokenService passTokenService;

    private UUID patientId;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        passAccessLogRepository.deleteAll();
        emergencyPassRepository.deleteAll();
        userRepository.deleteAll();

        User patient = userRepository.save(new User("admin-tests-patient@medipass.test", "test-password-hash"));
        patientId = patient.getId();

        User admin = new User("admin-tests-admin@medipass.test", "test-password-hash");
        admin.promoteToAdmin();
        adminId = userRepository.save(admin).getId();
    }

    @Test
    void adminEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patientRoleIsForbiddenFromAdminEndpoints() throws Exception {
        mockMvc.perform(get("/api/v1/admin/metrics")
                        .with(user(patientId.toString()).roles("PATIENT")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void adminCanReadAggregateMetricsAcrossAllUsers() throws Exception {
        EmergencyPass activePass = savePass(patientId, "metrics-active-token", Instant.now().plus(1, ChronoUnit.DAYS));
        EmergencyPass revokedPass = savePass(patientId, "metrics-revoked-token", Instant.now().plus(1, ChronoUnit.DAYS));
        revokedPass.revoke(Instant.now());
        emergencyPassRepository.saveAndFlush(revokedPass);

        passAccessLogRepository.saveAndFlush(new PassAccessLog(activePass.getId(), patientId, AccessOutcome.SUCCESS, "c-1"));
        passAccessLogRepository.saveAndFlush(new PassAccessLog(null, null, AccessOutcome.INVALID, "c-2"));

        mockMvc.perform(get("/api/v1/admin/metrics")
                        .with(user(adminId.toString()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(2))
                .andExpect(jsonPath("$.totalPasses").value(2))
                .andExpect(jsonPath("$.activePasses").value(1))
                .andExpect(jsonPath("$.revokedPasses").value(1))
                .andExpect(jsonPath("$.totalAccessLogs").value(2))
                .andExpect(jsonPath("$.successfulAccesses").value(1))
                .andExpect(jsonPath("$.invalidAccessAttempts").value(1));
    }

    @Test
    void adminCanSearchPassesAcrossAllUsersAndFilterByStatus() throws Exception {
        savePass(patientId, "search-active-token", Instant.now().plus(1, ChronoUnit.DAYS));
        EmergencyPass revoked = savePass(patientId, "search-revoked-token", Instant.now().plus(1, ChronoUnit.DAYS));
        revoked.revoke(Instant.now());
        emergencyPassRepository.saveAndFlush(revoked);

        mockMvc.perform(get("/api/v1/admin/passes")
                        .with(user(adminId.toString()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].userId").value(patientId.toString()));

        mockMvc.perform(get("/api/v1/admin/passes")
                        .queryParam("status", "REVOKED")
                        .with(user(adminId.toString()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].status").value("REVOKED"));
    }

    @Test
    void adminCanSearchAccessLogsAcrossAllUsersAndFilterByOutcome() throws Exception {
        passAccessLogRepository.saveAndFlush(new PassAccessLog(null, patientId, AccessOutcome.SUCCESS, "log-1"));
        passAccessLogRepository.saveAndFlush(new PassAccessLog(null, null, AccessOutcome.INVALID, "log-2"));

        mockMvc.perform(get("/api/v1/admin/access-logs")
                        .with(user(adminId.toString()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        mockMvc.perform(get("/api/v1/admin/access-logs")
                        .queryParam("outcome", "INVALID")
                        .with(user(adminId.toString()).roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].outcome").value("INVALID"))
                .andExpect(jsonPath("$[0].correlationId").value("log-2"));
    }

    @Test
    void adminSyntheaImportCountsBundleEntriesWithoutRequiringHapiFhir() throws Exception {
        String bundle = """
                {
                  "resourceType": "Bundle",
                  "type": "transaction",
                  "entry": [
                    {"resource": {"resourceType": "Patient"}},
                    {"resource": {"resourceType": "AllergyIntolerance"}}
                  ]
                }
                """;

        mockMvc.perform(post("/api/v1/admin/synthea/import")
                        .with(user(adminId.toString()).roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(bundle))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.resourcesReceived").value(2))
                .andExpect(jsonPath("$.status").value("ACCEPTED_NOT_PERSISTED"));
    }

    private EmergencyPass savePass(UUID userId, String rawToken, Instant expiresAt) {
        EmergencyPass pass = new EmergencyPass(
                userId,
                passTokenService.hashToken(rawToken),
                expiresAt,
                Set.of(ShareCategory.ALLERGIES)
        );
        return emergencyPassRepository.saveAndFlush(pass);
    }
}
