package com.medipass.pass;

import com.medipass.patient.dto.PatientProfileDto;

import java.time.LocalDate;

public record PublicDemographicsResponse(
        String fullName,
        LocalDate birthDate,
        String gender,
        String phone
) {
    public static PublicDemographicsResponse from(PatientProfileDto profile) {
        return new PublicDemographicsResponse(
                profile.fullName(),
                profile.birthDate(),
                profile.gender(),
                profile.phone()
        );
    }
}
