package com.medipass.patient;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PatientSecurityValidationTests {

    private static final String USER_A = "11111111-1111-1111-1111-111111111111";
    private static final String USER_B = "22222222-2222-2222-2222-222222222222";

    @Autowired
    private MockMvc mockMvc;

    @Test
    void patientEndpointRejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/v1/patients/me"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    void allergyCreationRejectsBlankSubstance() throws Exception {
        mockMvc.perform(post("/api/v1/patients/me/allergies")
                        .with(user(USER_A).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "substance": " ",
                                  "reaction": "Hives",
                                  "severity": "Severe"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.validationErrors.substance").exists());
    }

    @Test
    void clinicalDataIsScopedToAuthenticatedPatient() throws Exception {
        mockMvc.perform(post("/api/v1/patients/me/allergies")
                        .with(user(USER_A).roles("PATIENT"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "substance": "Penicillin",
                                  "reaction": "Rash",
                                  "severity": "Moderate"
                                }
                                """))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/patients/me/allergies")
                        .with(user(USER_B).roles("PATIENT")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }
}
