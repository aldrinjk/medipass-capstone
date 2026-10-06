package com.medipass.pass;

public class ResponderVerificationRequiredException extends RuntimeException {
    public ResponderVerificationRequiredException() {
        super("Responder verification is required before emergency information can be viewed.");
    }
}
