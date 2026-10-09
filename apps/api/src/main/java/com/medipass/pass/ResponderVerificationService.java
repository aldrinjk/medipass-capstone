package com.medipass.pass;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class ResponderVerificationService {

    private final EmergencyPassRepository passRepository;
    private final PassTokenService passTokenService;
    private final ResponderVerificationChallengeRepository challengeRepository;
    private final ResponderOtpProvider otpProvider;
    private final long challengeMinutes;
    private final long sessionMinutes;
    private final int maxAttempts;

    public ResponderVerificationService(
            EmergencyPassRepository passRepository,
            PassTokenService passTokenService,
            ResponderVerificationChallengeRepository challengeRepository,
            ResponderOtpProvider otpProvider,
            @Value("${medipass.responder-verification.challenge-minutes:5}") long challengeMinutes,
            @Value("${medipass.responder-verification.session-minutes:15}") long sessionMinutes,
            @Value("${medipass.responder-verification.max-attempts:5}") int maxAttempts
    ) {
        this.passRepository = passRepository;
        this.passTokenService = passTokenService;
        this.challengeRepository = challengeRepository;
        this.otpProvider = otpProvider;
        this.challengeMinutes = challengeMinutes;
        this.sessionMinutes = sessionMinutes;
        this.maxAttempts = Math.max(1, maxAttempts);
    }

    @Transactional
    public ResponderVerificationStartResponse start(
            String rawPassToken,
            ResponderVerificationStartRequest request,
            String responderDevice
    ) {
        EmergencyPass pass = resolveActivePass(rawPassToken);
        Instant now = Instant.now();
        challengeRepository.deleteByStatusAndChallengeExpiresAtBefore(
                ResponderVerificationStatus.PENDING,
                now
        );

        String phone = request.phone().trim();
        String last4 = phone.substring(phone.length() - 4);
        Instant expiresAt = now.plus(challengeMinutes, ChronoUnit.MINUTES);

        ResponderVerificationChallenge challenge =
                ResponderVerificationChallenge.pending(
                        pass.getId(),
                        clean(request.name()),
                        cleanNullable(request.role()),
                        cleanNullable(request.organization()),
                        phone,
                        last4,
                        cleanDevice(responderDevice),
                        expiresAt
                );

        challengeRepository.saveAndFlush(challenge);
        otpProvider.start(challenge.getId(), phone);

        return new ResponderVerificationStartResponse(
                challenge.getId(),
                maskPhone(phone),
                expiresAt,
                otpProvider.deliveryMode(),
                otpProvider.developmentCode()
        );
    }

    @Transactional(noRollbackFor = ResponderVerificationException.class)
    public ResponderVerificationSessionResponse confirm(
            String rawPassToken,
            ResponderVerificationConfirmRequest request
    ) {
        EmergencyPass pass = resolveActivePass(rawPassToken);
        ResponderVerificationChallenge challenge = challengeRepository
                .findByIdAndPassId(request.challengeId(), pass.getId())
                .orElseThrow(() -> new ResponderVerificationException(
                        "Verification challenge was not found."
                ));

        if (challenge.getStatus() == ResponderVerificationStatus.LOCKED) {
            throw new ResponderVerificationException(
                    "Too many incorrect attempts. Request a new code."
            );
        }

        if (challenge.getStatus() != ResponderVerificationStatus.PENDING
                || !challenge.getChallengeExpiresAt().isAfter(Instant.now())
                || challenge.getPhoneE164() == null) {
            throw new ResponderVerificationException(
                    "Verification challenge has expired. Request a new code."
            );
        }

        if (!otpProvider.verify(
                challenge.getId(),
                challenge.getPhoneE164(),
                request.code()
        )) {
            challenge.recordFailedAttempt(maxAttempts);
            challengeRepository.saveAndFlush(challenge);

            if (challenge.getStatus() == ResponderVerificationStatus.LOCKED) {
                throw new ResponderVerificationException(
                        "Too many incorrect attempts. Request a new code."
                );
            }

            throw new ResponderVerificationException(
                    "The verification code is incorrect."
            );
        }

        String rawSessionToken = passTokenService.generateToken();
        Instant sessionExpiry = sessionExpiry(pass);
        challenge.activatePhoneVerification(
                passTokenService.hashToken(rawSessionToken),
                sessionExpiry,
                otpProvider.verificationNote()
        );
        challengeRepository.saveAndFlush(challenge);

        return new ResponderVerificationSessionResponse(
                rawSessionToken,
                ResponderVerificationMethod.PHONE_OTP,
                challenge.getResponderName(),
                "••••" + challenge.getPhoneLast4(),
                sessionExpiry
        );
    }

    @Transactional
    public ResponderVerificationSessionResponse emergencyOverride(
            String rawPassToken,
            ResponderEmergencyOverrideRequest request,
            String responderDevice
    ) {
        EmergencyPass pass = resolveActivePass(rawPassToken);
        String rawSessionToken = passTokenService.generateToken();
        Instant sessionExpiry = sessionExpiry(pass);

        ResponderVerificationChallenge challenge =
                ResponderVerificationChallenge.emergencyOverride(
                        pass.getId(),
                        clean(request.name()),
                        cleanNullable(request.role()),
                        cleanNullable(request.organization()),
                        cleanDevice(responderDevice),
                        clean(request.reason()),
                        passTokenService.hashToken(rawSessionToken),
                        sessionExpiry
                );

        challengeRepository.saveAndFlush(challenge);

        return new ResponderVerificationSessionResponse(
                rawSessionToken,
                ResponderVerificationMethod.EMERGENCY_OVERRIDE,
                challenge.getResponderName(),
                null,
                sessionExpiry
        );
    }

    @Transactional(readOnly = true)
    public ResponderVerificationIdentity requireSession(
            java.util.UUID passId,
            String rawVerificationToken
    ) {
        if (rawVerificationToken == null || rawVerificationToken.isBlank()) {
            throw new ResponderVerificationRequiredException();
        }

        String tokenHash = passTokenService.hashToken(rawVerificationToken.trim());
        ResponderVerificationChallenge challenge = challengeRepository
                .findByAccessTokenHashAndPassIdAndStatus(
                        tokenHash,
                        passId,
                        ResponderVerificationStatus.ACTIVE
                )
                .orElseThrow(ResponderVerificationRequiredException::new);

        if (challenge.getSessionExpiresAt() == null
                || !challenge.getSessionExpiresAt().isAfter(Instant.now())) {
            throw new ResponderVerificationRequiredException();
        }

        return new ResponderVerificationIdentity(
                challenge.getResponderName(),
                challenge.getResponderRole(),
                challenge.getResponderOrganization(),
                challenge.getPhoneLast4(),
                challenge.getVerificationMethod(),
                challenge.getVerificationNote()
        );
    }

    private EmergencyPass resolveActivePass(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new PublicPassNotFoundException();
        }

        EmergencyPass pass = passRepository
                .findByTokenHash(passTokenService.hashToken(rawToken))
                .orElseThrow(PublicPassNotFoundException::new);

        if (pass.getStatus() == PassStatus.REVOKED) {
            throw new PublicPassGoneException(PassStatus.REVOKED);
        }

        if (pass.getStatus() == PassStatus.EXPIRED
                || !pass.getExpiresAt().isAfter(Instant.now())) {
            throw new PublicPassGoneException(PassStatus.EXPIRED);
        }

        return pass;
    }

    private Instant sessionExpiry(EmergencyPass pass) {
        Instant requested = Instant.now().plus(sessionMinutes, ChronoUnit.MINUTES);
        return requested.isBefore(pass.getExpiresAt()) ? requested : pass.getExpiresAt();
    }

    private String maskPhone(String phone) {
        return "••••" + phone.substring(phone.length() - 4);
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }

    private String cleanNullable(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String cleanDevice(String value) {
        if (value == null || value.isBlank()) {
            return "Unknown device · Browser";
        }
        String trimmed = value.trim();
        return trimmed.length() <= 120 ? trimmed : trimmed.substring(0, 120);
    }
}
