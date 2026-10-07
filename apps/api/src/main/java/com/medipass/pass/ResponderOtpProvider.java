package com.medipass.pass;

public interface ResponderOtpProvider {

    void start(String phoneE164);

    boolean verify(String phoneE164, String code);

    String deliveryMode();

    default String developmentCode() {
        return null;
    }
}
