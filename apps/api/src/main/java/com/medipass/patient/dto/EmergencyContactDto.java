package com.medipass.patient.dto;

public record EmergencyContactDto(
        String name,
        String relationship,
        String phone
) {
}
