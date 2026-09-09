package com.medipass.pass;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import org.junit.jupiter.api.AfterEach;
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
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class EmergencyPassTests {

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

        User userA = userRepository.save(new User("pass-a@medipass.test", "test-password-hash"));
        User userB = userRepository.save(new User("pass-b@medipass.test", "test-password-hash"));
        userAId = userA.getId();
        userBId = userB.getId();
    }

    @AfterEach
    void cleanUp() {
        emergencyPassRepository.deleteAll();
    }

    @Test
    void passEndpointsRejectUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/v1/passes"))
                .andExpect(status().is4xxClientError());

        mockMvc.perform(post("/api/v1/passes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateBody()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void createPassStoresOnlyHashAndPersistsCategories() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/passes")
                        .with(user(userAId.toString()).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateBody()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.categories", containsInAnyOrder(
                        "ALLERGIES", "MEDICATIONS", "EMERGENCY_CONTACT"
                )))
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        UUID passId = UUID.fromString(response.get("passId").asText());
        String publicUrl = response.get("publicUrl").asText();
        String rawToken = publicUrl.substring(publicUrl.lastIndexOf('/') + 1);

        EmergencyPass saved = emergencyPassRepository.findById(passId).orElseThrow();

        org.junit.jupiter.api.Assertions.assertEquals(64, saved.getTokenHash().length());
        org.junit.jupiter.api.Assertions.assertNotEquals(rawToken, saved.getTokenHash());
        org.junit.jupiter.api.Assertions.assertEquals(passTokenService.hashToken(rawToken), saved.getTokenHash());
        org.junit.jupiter.api.Assertions.assertEquals(
                List.of("ALLERGIES", "EMERGENCY_CONTACT", "MEDICATIONS").stream().sorted().toList(),
                saved.getCategories().stream().map(Enum::name).sorted().toList()
        );
    }

    @Test
    void createPassRejectsPastExpiry() throws Exception {
        String body = """
                {
                  "categories": ["ALLERGIES"],
                  "expiresAt": "%s"
                }
                """.formatted(Instant.now().minus(1, ChronoUnit.HOURS));

        mockMvc.perform(post("/api/v1/passes")
                        .with(user(userAId.toString()).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    void passesAreScopedToAuthenticatedPatient() throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/v1/passes")
                        .with(user(userAId.toString()).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateBody()))
                .andExpect(status().isCreated())
                .andReturn();

        UUID passId = UUID.fromString(
                objectMapper.readTree(createResult.getResponse().getContentAsString()).get("passId").asText()
        );

        mockMvc.perform(get("/api/v1/passes")
                        .with(user(userBId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());

        mockMvc.perform(get("/api/v1/passes/{passId}", passId)
                        .with(user(userBId.toString()).roles("PATIENT")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PASS_NOT_FOUND"));

        mockMvc.perform(get("/api/v1/passes/{passId}", passId)
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.passId").value(passId.toString()))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    private String validCreateBody() {
        return """
                {
                  "categories": ["ALLERGIES", "MEDICATIONS", "EMERGENCY_CONTACT"],
                  "expiresAt": "%s"
                }
                """.formatted(Instant.now().plus(2, ChronoUnit.DAYS));
    }
}
