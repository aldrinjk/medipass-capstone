package com.medipass.e2e;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medipass.audit.PassAccessLogRepository;
import com.medipass.auth.UserRepository;
import com.medipass.pass.EmergencyPassRepository;
import com.medipass.sharing.SharingPreferenceRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Drives the exact "First Development Goal" flow from the team roadmap end to
 * end through the real REST contract - no shortcuts (mock users, direct
 * repository writes) except where a downstream module isn't built yet
 * (ClinicalService is still the fake adapter; that swap is M4's job and
 * doesn't change any of the request/response shapes exercised here):
 *
 *   register -> login -> create profile -> add allergy/medication/condition
 *   -> select sharing categories -> create pass -> QR/public access
 *   -> access gets logged -> revoke -> same token no longer works
 *
 * This is the automated, backend-driven equivalent of the milestone's E2E
 * gate, standing in for a browser-driven Playwright suite until apps/mobile
 * and apps/responder-web exist (see docs/testing/README.md).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MediPassEndToEndFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmergencyPassRepository emergencyPassRepository;

    @Autowired
    private PassAccessLogRepository passAccessLogRepository;

    @Autowired
    private SharingPreferenceRepository sharingPreferenceRepository;

    @BeforeEach
    void setUp() {
        passAccessLogRepository.deleteAll();
        emergencyPassRepository.deleteAll();
        sharingPreferenceRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void fullPatientToResponderJourneyWorksEndToEnd() throws Exception {
        String email = "e2e-flow@medipass.test";
        String password = "correct-horse-battery-staple";

        // 1. Register
        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(email));

        // 2. Log in
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, password)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn();

        JsonNode tokens = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String bearer = "Bearer " + tokens.get("accessToken").asText();

        // /auth/me confirms the session is really authenticated
        mockMvc.perform(get("/api/v1/auth/me").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        // 3. Create profile
        mockMvc.perform(put("/api/v1/patients/me")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"E2E Test Patient","birthDate":"1990-01-01","gender":"female","phone":"+1-555-0199"}
                                """))
                .andExpect(status().isOk());

        // 4. Add allergy / medication / condition
        mockMvc.perform(post("/api/v1/patients/me/allergies")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"substance":"Penicillin","reaction":"Anaphylaxis","severity":"Severe"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/patients/me/medications")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Metformin","dosage":"500 mg","frequency":"Twice daily"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/v1/patients/me/conditions")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Type 2 Diabetes","status":"Active"}
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(put("/api/v1/patients/me/emergency-contact")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Alex Contact","relationship":"Sibling","phone":"+1-555-0100"}
                                """))
                .andExpect(status().isOk());

        // 5. Select information to share (allergies + emergency contact only)
        mockMvc.perform(put("/api/v1/patients/me/sharing-preferences")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"categories":["ALLERGIES","EMERGENCY_CONTACT"]}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories", org.hamcrest.Matchers.containsInAnyOrder(
                        "ALLERGIES", "EMERGENCY_CONTACT")));

        // 6. Create emergency pass matching those categories
        String expiresAt = Instant.now().plus(2, ChronoUnit.DAYS).toString();
        MvcResult createPassResult = mockMvc.perform(post("/api/v1/passes")
                        .header("Authorization", bearer)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"categories":["ALLERGIES","EMERGENCY_CONTACT"],"expiresAt":"%s"}
                                """.formatted(expiresAt)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.publicUrl").exists())
                .andReturn();

        JsonNode pass = objectMapper.readTree(createPassResult.getResponse().getContentAsString());
        String passId = pass.get("passId").asText();
        String publicUrl = pass.get("publicUrl").asText();
        String rawToken = publicUrl.substring(publicUrl.lastIndexOf('/') + 1);

        // Pass shows up in the patient's own pass list
        mockMvc.perform(get("/api/v1/passes").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].passId").value(passId));

        // 7-8. QR scan -> anonymous public access, filtered to the allowed categories
        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories", org.hamcrest.Matchers.containsInAnyOrder(
                        "ALLERGIES", "EMERGENCY_CONTACT")))
                .andExpect(jsonPath("$.allergies[0].substance").value("Penicillin"))
                .andExpect(jsonPath("$.emergencyContact.name").value("Alex Contact"))
                .andExpect(jsonPath("$.medications").doesNotExist())
                .andExpect(jsonPath("$.conditions").doesNotExist());

        // 9. Access gets logged
        mockMvc.perform(get("/api/v1/patients/me/access-logs").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].outcome").value("SUCCESS"));

        // 10. Patient revokes the pass
        mockMvc.perform(post("/api/v1/passes/{passId}/revoke", passId).header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REVOKED"));

        // 11. Same QR no longer works
        mockMvc.perform(get("/api/v1/public/passes/{token}", rawToken))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("PUBLIC_PASS_REVOKED"));

        // ...and the blocked attempt is logged too
        mockMvc.perform(get("/api/v1/patients/me/access-logs").header("Authorization", bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        assertThat(passAccessLogRepository.findAllByUserIdOrderByAccessedAtDesc(
                userRepository.findByEmailIgnoreCase(email).orElseThrow().getId()
        )).hasSize(2);
    }
}
