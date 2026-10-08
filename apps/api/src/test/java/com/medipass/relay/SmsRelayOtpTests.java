package com.medipass.relay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import com.medipass.pass.EmergencyPass;
import com.medipass.pass.EmergencyPassRepository;
import com.medipass.pass.PassTokenService;
import com.medipass.pass.ResponderVerificationChallenge;
import com.medipass.pass.ResponderVerificationChallengeRepository;
import com.medipass.pass.ResponderVerificationStatus;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "medipass.responder-verification.provider=android-relay",
        "medipass.sms-relay.shared-key=test-relay-shared-key-0123456789abcdef",
        "medipass.responder-verification.max-attempts=5"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SmsRelayOtpTests {

    private static final String RELAY_KEY = "test-relay-shared-key-0123456789abcdef";
    private static final Pattern OTP_PATTERN =
            Pattern.compile("MediPass: (\\d{6})");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EmergencyPassRepository emergencyPassRepository;

    @Autowired
    private ResponderVerificationChallengeRepository challengeRepository;

    @Autowired
    private SmsRelayJobRepository relayJobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PassTokenService passTokenService;

    private UUID userId;

    @BeforeEach
    void setUp() {
        relayJobRepository.deleteAll();
        challengeRepository.deleteAll();
        emergencyPassRepository.deleteAll();
        userRepository.deleteAll();

        User user = userRepository.save(new User(
                "relay-test@medipass.test",
                "test-password-hash"
        ));
        userId = user.getId();
    }

    @Test
    void androidRelayDeliversChallengeAndOtpUnlocksResponderSession() throws Exception {
        String passToken = "android-relay-success-token";
        savePass(passToken);

        MvcResult start = startVerification(passToken);
        JsonNode startBody = objectMapper.readTree(start.getResponse().getContentAsString());
        UUID challengeId = UUID.fromString(startBody.get("challengeId").asText());

        mockMvc.perform(get("/api/v1/relay/status")
                        .header("X-MediPass-Relay-Key", RELAY_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("READY"));

        MvcResult claim = mockMvc.perform(post("/api/v1/relay/sms-jobs/claim")
                        .header("X-MediPass-Relay-Key", RELAY_KEY))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.destinationE164").value("+15550010199"))
                .andExpect(jsonPath("$.deliveryAttempt").value(1))
                .andReturn();

        JsonNode claimedJob = objectMapper.readTree(
                claim.getResponse().getContentAsString()
        );
        UUID jobId = UUID.fromString(claimedJob.get("jobId").asText());
        String code = extractOtp(claimedJob.get("message").asText());

        mockMvc.perform(post("/api/v1/relay/sms-jobs/{jobId}/sent", jobId)
                        .header("X-MediPass-Relay-Key", RELAY_KEY))
                .andExpect(status().isNoContent());

        mockMvc.perform(post(
                                "/api/v1/public/passes/{token}/verification/confirm",
                                passToken
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "challengeId":"%s",
                                  "code":"%s"
                                }
                                """.formatted(challengeId, code)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.verificationMethod").value("PHONE_OTP"))
                .andExpect(jsonPath("$.maskedPhone").value("••••0199"));

        ResponderVerificationChallenge challenge = challengeRepository
                .findById(challengeId)
                .orElseThrow();
        assertEquals(ResponderVerificationStatus.ACTIVE, challenge.getStatus());
        assertEquals(
                "OTP delivered through the MediPass Android SMS relay.",
                challenge.getVerificationNote()
        );
        assertNull(challenge.getPhoneE164());

        SmsRelayJob job = relayJobRepository.findById(jobId).orElseThrow();
        assertEquals(SmsRelayJobStatus.VERIFIED, job.getStatus());
        assertNull(job.getDestinationE164());
        assertNull(job.getMessageBody());
        assertNull(job.getOtpHash());
    }

    @Test
    void relayEndpointsRejectWrongSharedKey() throws Exception {
        mockMvc.perform(get("/api/v1/relay/status")
                        .header("X-MediPass-Relay-Key", "wrong-relay-key"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("SMS_RELAY_UNAUTHORIZED"));
    }

    @Test
    void fiveIncorrectOtpAttemptsLockChallengeAndScrubFullPhone() throws Exception {
        String passToken = "android-relay-lockout-token";
        savePass(passToken);

        MvcResult start = startVerification(passToken);
        UUID challengeId = UUID.fromString(
                objectMapper.readTree(start.getResponse().getContentAsString())
                        .get("challengeId")
                        .asText()
        );

        MvcResult claim = mockMvc.perform(post("/api/v1/relay/sms-jobs/claim")
                        .header("X-MediPass-Relay-Key", RELAY_KEY))
                .andExpect(status().isOk())
                .andReturn();

        UUID jobId = UUID.fromString(
                objectMapper.readTree(claim.getResponse().getContentAsString())
                        .get("jobId")
                        .asText()
        );

        mockMvc.perform(post("/api/v1/relay/sms-jobs/{jobId}/sent", jobId)
                        .header("X-MediPass-Relay-Key", RELAY_KEY))
                .andExpect(status().isNoContent());

        for (int attempt = 1; attempt <= 4; attempt++) {
            confirmWrongCode(passToken, challengeId)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.message").value(
                            "The verification code is incorrect."
                    ));
        }

        confirmWrongCode(passToken, challengeId)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Too many incorrect attempts. Request a new code."
                ));

        ResponderVerificationChallenge challenge = challengeRepository
                .findById(challengeId)
                .orElseThrow();
        assertEquals(ResponderVerificationStatus.LOCKED, challenge.getStatus());
        assertEquals(5, challenge.getAttempts());
        assertNull(challenge.getPhoneE164());
    }

    private MvcResult startVerification(String passToken) throws Exception {
        return mockMvc.perform(post(
                                "/api/v1/public/passes/{token}/verification/start",
                                passToken
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Relay Test Responder",
                                  "role":"Paramedic",
                                  "organization":"Demo EMS",
                                  "phone":"+15550010199"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.deliveryMode").value("SMS"))
                .andExpect(jsonPath("$.developmentCode").doesNotExist())
                .andReturn();
    }

    private org.springframework.test.web.servlet.ResultActions confirmWrongCode(
            String passToken,
            UUID challengeId
    ) throws Exception {
        return mockMvc.perform(post(
                                "/api/v1/public/passes/{token}/verification/confirm",
                                passToken
                        )
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "challengeId":"%s",
                                  "code":"000000"
                                }
                                """.formatted(challengeId)));
    }

    private String extractOtp(String message) {
        Matcher matcher = OTP_PATTERN.matcher(message);
        if (!matcher.find()) {
            throw new IllegalStateException("OTP was not present in relay message.");
        }
        return matcher.group(1);
    }

    private EmergencyPass savePass(String rawToken) {
        EmergencyPass pass = new EmergencyPass(
                userId,
                passTokenService.hashToken(rawToken),
                Instant.now().plus(1, ChronoUnit.HOURS),
                Set.of(ShareCategory.DEMOGRAPHICS)
        );
        return emergencyPassRepository.saveAndFlush(pass);
    }
}
