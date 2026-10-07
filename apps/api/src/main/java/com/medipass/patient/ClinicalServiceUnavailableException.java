package com.medipass.patient;

public class ClinicalServiceUnavailableException extends RuntimeException {

    public ClinicalServiceUnavailableException(String message) {
        super(message);
    }

    public ClinicalServiceUnavailableException(String message, Throwable cause) {
        super(message, cause);
    }
}
