package com.medipass.pass;

import com.medipass.relay.SmsRelayJobService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@ConditionalOnProperty(
        name = "medipass.responder-verification.provider",
        havingValue = "android-relay"
)
public class AndroidSmsRelayOtpProvider implements ResponderOtpProvider {

    private static final String VERIFICATION_NOTE =
            "OTP delivered through the MediPass Android SMS relay.";

    private final SmsRelayJobService relayJobService;
    private final ResponderVerificationChallengeRepository challengeRepository;

    public AndroidSmsRelayOtpProvider(
            SmsRelayJobService relayJobService,
            ResponderVerificationChallengeRepository challengeRepository
    ) {
        this.relayJobService = relayJobService;
        this.challengeRepository = challengeRepository;
    }

    @Override
    public void start(UUID challengeId, String phoneE164) {
        ResponderVerificationChallenge challenge = challengeRepository
                .findById(challengeId)
                .orElseThrow(() -> new ResponderVerificationException(
                        "Verification challenge was not found."
                ));

        relayJobService.queueVerification(
                challengeId,
                phoneE164,
                challenge.getChallengeExpiresAt()
        );
    }

    @Override
    public boolean verify(UUID challengeId, String phoneE164, String code) {
        return relayJobService.verifyOtp(challengeId, code);
    }

    @Override
    public String deliveryMode() {
        return "SMS";
    }

    @Override
    public String verificationNote() {
        return VERIFICATION_NOTE;
    }
}
