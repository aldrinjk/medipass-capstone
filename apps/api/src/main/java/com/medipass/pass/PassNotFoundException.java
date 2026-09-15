package com.medipass.pass;

public class PassNotFoundException extends RuntimeException {
    public PassNotFoundException() {
        super("Emergency pass was not found.");
    }
}
