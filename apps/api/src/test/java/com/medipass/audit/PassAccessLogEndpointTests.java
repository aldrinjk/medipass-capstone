package com.medipass.audit;

import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PassAccessLogEndpointTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PassAccessLogRepository passAccessLogRepository;

    @Autowired
    private UserRepository userRepository;

    private UUID userAId;
    private UUID userBId;

    @BeforeEach
    void setUp() {
        passAccessLogRepository.deleteAll();
        userRepository.deleteAll();

        User userA = userRepository.save(new User("audit-a@medipass.test", "test-password-hash"));
        User userB = userRepository.save(new User("audit-b@medipass.test", "test-password-hash"));
        userAId = userA.getId();
        userBId = userB.getId();
    }

    @Test
    void accessLogEndpointsRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/patients/me/access-logs"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void patientOnlySeesOwnAccessLogs() throws Exception {
        passAccessLogRepository.saveAndFlush(new PassAccessLog(null, userAId, AccessOutcome.SUCCESS));
        passAccessLogRepository.saveAndFlush(new PassAccessLog(null, userBId, AccessOutcome.EXPIRED));

        mockMvc.perform(get("/api/v1/patients/me/access-logs")
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].outcome").value("SUCCESS"))
                .andExpect(jsonPath("$[0].userId").doesNotExist());
    }

    @Test
    void patientCanReadOwnAccessLogById() throws Exception {
        PassAccessLog ownLog = passAccessLogRepository.saveAndFlush(
                new PassAccessLog(null, userAId, AccessOutcome.REVOKED)
        );

        mockMvc.perform(get("/api/v1/patients/me/access-logs/{id}", ownLog.getId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ownLog.getId().toString()))
                .andExpect(jsonPath("$.outcome").value("REVOKED"))
                .andExpect(jsonPath("$.userId").doesNotExist());
    }

    @Test
    void patientCannotReadAnotherPatientsAccessLog() throws Exception {
        PassAccessLog otherUsersLog = passAccessLogRepository.saveAndFlush(
                new PassAccessLog(null, userBId, AccessOutcome.SUCCESS)
        );

        mockMvc.perform(get("/api/v1/patients/me/access-logs/{id}", otherUsersLog.getId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ACCESS_LOG_NOT_FOUND"));
    }
}
