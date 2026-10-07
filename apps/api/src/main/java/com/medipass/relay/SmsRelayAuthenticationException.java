package com.medipass.relay;

public class SmsRelayAuthenticationException extends RuntimeException {
    public SmsRelayAuthenticationException() {
        super("SMS relay authentication failed.");
    }
}
