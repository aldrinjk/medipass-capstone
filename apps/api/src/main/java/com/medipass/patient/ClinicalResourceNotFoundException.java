package com.medipass.patient;

public class ClinicalResourceNotFoundException extends RuntimeException {
    public ClinicalResourceNotFoundException(String message) {
        super(message);
    }
}
