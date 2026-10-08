package com.medipass.relay;

public class SmsRelayJobNotFoundException extends RuntimeException {
    public SmsRelayJobNotFoundException() {
        super("SMS relay job was not found.");
    }
}
