package com.medipass.pass;

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
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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

    private UUID userId;

    @BeforeEach
    void setUp() {
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
