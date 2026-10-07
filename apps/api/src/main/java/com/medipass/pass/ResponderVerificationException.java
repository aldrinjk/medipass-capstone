package com.medipass.pass;

public class ResponderVerificationException extends RuntimeException {
    public ResponderVerificationException(String message) {
        super(message);
    }

    public ResponderVerificationException(String message, Throwable cause) {
        super(message, cause);
    }
}
