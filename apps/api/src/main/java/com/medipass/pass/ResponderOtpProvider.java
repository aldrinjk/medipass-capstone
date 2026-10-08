package com.medipass.pass;

import java.util.UUID;

public interface ResponderOtpProvider {

    void start(UUID challengeId, String phoneE164);

    boolean verify(UUID challengeId, String phoneE164, String code);

    String deliveryMode();

    default String developmentCode() {
        return null;
    }

    default String verificationNote() {
        return null;
    }
}
