package com.medipass.pass;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import com.medipass.sharing.ShareCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PassLifecycleTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmergencyPassRepository emergencyPassRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PassTokenService passTokenService;

    private UUID userAId;
    private UUID userBId;

    @BeforeEach
    void setUp() {
        emergencyPassRepository.deleteAll();
        userRepository.deleteAll();

        User userA = userRepository.save(new User("lifecycle-a@medipass.test", "test-password-hash"));
        User userB = userRepository.save(new User("lifecycle-b@medipass.test", "test-password-hash"));
        userAId = userA.getId();
        userBId = userB.getId();
    }

    @Test
    void revokeActivePassPersistsRevocationAndBlocksPublicAccess() throws Exception {
        CreatedPass created = createActivePass(userAId);

        mockMvc.perform(post("/api/v1/passes/{passId}/revoke", created.passId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passId").value(created.passId().toString()))
                .andExpect(jsonPath("$.status").value("REVOKED"))
                .andExpect(jsonPath("$.revokedAt").exists());

        EmergencyPass saved = emergencyPassRepository.findById(created.passId()).orElseThrow();
        assertEquals(PassStatus.REVOKED, saved.getStatus());

        mockMvc.perform(get("/api/v1/public/passes/{token}", created.rawToken()))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("PUBLIC_PASS_REVOKED"));
    }

    @Test
    void lifecycleActionsAreScopedToAuthenticatedPatient() throws Exception {
        CreatedPass created = createActivePass(userAId);

        mockMvc.perform(post("/api/v1/passes/{passId}/revoke", created.passId())
                        .with(user(userBId.toString()).roles("PATIENT")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PASS_NOT_FOUND"));

        mockMvc.perform(post("/api/v1/passes/{passId}/rotate", created.passId())
                        .with(user(userBId.toString()).roles("PATIENT")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PASS_NOT_FOUND"));

        assertEquals(
                PassStatus.ACTIVE,
                emergencyPassRepository.findById(created.passId()).orElseThrow().getStatus()
        );
    }

    @Test
    void expiredPassMetadataIsPersistedAsExpiredWhenRead() throws Exception {
        EmergencyPass expired = emergencyPassRepository.saveAndFlush(
                new EmergencyPass(
                        userAId,
                        passTokenService.hashToken("expired-metadata-token"),
                        Instant.now().minus(1, ChronoUnit.HOURS),
                        Set.of(ShareCategory.ALLERGIES)
                )
        );

        mockMvc.perform(get("/api/v1/passes/{passId}", expired.getId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("EXPIRED"));

        EmergencyPass persisted = emergencyPassRepository.findById(expired.getId()).orElseThrow();
        assertEquals(PassStatus.EXPIRED, persisted.getStatus());
    }

    @Test
    void rotatePassKeepsPassIdAndInvalidatesOldToken() throws Exception {
        CreatedPass created = createActivePass(userAId);

        MvcResult rotateResult = mockMvc.perform(post("/api/v1/passes/{passId}/rotate", created.passId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passId").value(created.passId().toString()))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.publicUrl").exists())
                .andReturn();

        JsonNode response = objectMapper.readTree(rotateResult.getResponse().getContentAsString());
        String newPublicUrl = response.get("publicUrl").asText();
        String newRawToken = tokenFromUrl(newPublicUrl);

        assertNotEquals(created.rawToken(), newRawToken);

        EmergencyPass saved = emergencyPassRepository.findById(created.passId()).orElseThrow();
        assertEquals(passTokenService.hashToken(newRawToken), saved.getTokenHash());
        assertNotEquals(passTokenService.hashToken(created.rawToken()), saved.getTokenHash());

        mockMvc.perform(get("/api/v1/public/passes/{token}", created.rawToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PUBLIC_PASS_NOT_FOUND"));

        mockMvc.perform(get("/api/v1/public/passes/{token}", newRawToken))
                .andExpect(status().isOk());
    }

    @Test
    void revokedAndExpiredPassesCannotBeRotated() throws Exception {
        CreatedPass revoked = createActivePass(userAId);

        mockMvc.perform(post("/api/v1/passes/{passId}/revoke", revoked.passId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/passes/{passId}/rotate", revoked.passId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PASS_LIFECYCLE_CONFLICT"));

        EmergencyPass expired = emergencyPassRepository.saveAndFlush(
                new EmergencyPass(
                        userAId,
                        passTokenService.hashToken("expired-rotation-token"),
                        Instant.now().minus(1, ChronoUnit.HOURS),
                        Set.of(ShareCategory.ALLERGIES)
                )
        );

        mockMvc.perform(post("/api/v1/passes/{passId}/rotate", expired.getId())
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PASS_LIFECYCLE_CONFLICT"));

        assertEquals(
                PassStatus.EXPIRED,
                emergencyPassRepository.findById(expired.getId()).orElseThrow().getStatus()
        );
    }

    private CreatedPass createActivePass(UUID userId) throws Exception {
        String body = """
                {
                  "categories": ["ALLERGIES"],
                  "expiresAt": "%s"
                }
                """.formatted(Instant.now().plus(2, ChronoUnit.DAYS));

        MvcResult result = mockMvc.perform(post("/api/v1/passes")
                        .with(user(userId.toString()).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        UUID passId = UUID.fromString(response.get("passId").asText());
        String publicUrl = response.get("publicUrl").asText();
        return new CreatedPass(passId, tokenFromUrl(publicUrl));
    }

    private String tokenFromUrl(String publicUrl) {
        return publicUrl.substring(publicUrl.lastIndexOf('/') + 1);
    }

    private record CreatedPass(UUID passId, String rawToken) {
    }
}
