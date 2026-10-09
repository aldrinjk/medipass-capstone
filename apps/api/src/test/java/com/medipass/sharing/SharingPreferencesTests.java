package com.medipass.sharing;

import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SharingPreferencesTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SharingPreferenceRepository sharingPreferenceRepository;

    @Autowired
    private UserRepository userRepository;

    private UUID userAId;
    private UUID userBId;

    @BeforeEach
    void setUp() {
        sharingPreferenceRepository.deleteAll();
        userRepository.deleteAll();

        User userA = userRepository.save(new User("sharing-a@medipass.test", "test-password-hash"));
        User userB = userRepository.save(new User("sharing-b@medipass.test", "test-password-hash"));
        userAId = userA.getId();
        userBId = userB.getId();
    }

    @Test
    void sharingPreferencesRejectUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/v1/patients/me/sharing-preferences"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void newPatientHasNoSharedCategoriesByDefault() throws Exception {
        mockMvc.perform(get("/api/v1/patients/me/sharing-preferences")
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories").isArray())
                .andExpect(jsonPath("$.categories").isEmpty());
    }

    @Test
    void updatePersistsSelectedCategories() throws Exception {
        mockMvc.perform(put("/api/v1/patients/me/sharing-preferences")
                        .with(user(userAId.toString()).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "categories": ["ALLERGIES", "MEDICATIONS", "EMERGENCY_CONTACT"]
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories", containsInAnyOrder(
                        "ALLERGIES", "MEDICATIONS", "EMERGENCY_CONTACT"
                )));

        mockMvc.perform(get("/api/v1/patients/me/sharing-preferences")
                        .with(user(userAId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories", containsInAnyOrder(
                        "ALLERGIES", "MEDICATIONS", "EMERGENCY_CONTACT"
                )));
    }

    @Test
    void preferencesAreScopedToAuthenticatedPatient() throws Exception {
        mockMvc.perform(put("/api/v1/patients/me/sharing-preferences")
                        .with(user(userAId.toString()).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "categories": ["CONDITIONS"]
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/patients/me/sharing-preferences")
                        .with(user(userBId.toString()).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.categories").isEmpty());
    }
}
