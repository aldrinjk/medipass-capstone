package com.medipass.patient;

import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.patient.dto.UpdatePatientProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients/me")
public class PatientController {

    private final ClinicalService clinicalService;

    public PatientController(ClinicalService clinicalService) {
        this.clinicalService = clinicalService;
    }

    @GetMapping
    public ResponseEntity<PatientProfileDto> getProfile(Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(clinicalService.getPatientProfile(userId));
    }

    @PutMapping
    public ResponseEntity<PatientProfileDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdatePatientProfileRequest request
    ) {
        UUID userId = UUID.fromString(authentication.getName());
        return ResponseEntity.ok(clinicalService.updatePatientProfile(userId, request));
    }
}
