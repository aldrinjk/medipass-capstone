package com.medipass.pass;

public class PublicPassNotFoundException extends RuntimeException {
    public PublicPassNotFoundException() {
        super("Public emergency pass was not found.");
    }
}
