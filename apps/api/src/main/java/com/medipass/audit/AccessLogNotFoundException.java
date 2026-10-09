package com.medipass.audit;

public class AccessLogNotFoundException extends RuntimeException {

    public AccessLogNotFoundException() {
        super("Access log not found.");
    }
}
