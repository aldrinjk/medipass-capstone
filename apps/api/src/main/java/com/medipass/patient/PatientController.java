package com.medipass.patient;

import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.AllergyRequest;
import com.medipass.patient.dto.PatientProfileDto;
import com.medipass.patient.dto.UpdatePatientProfileRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
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
        return ResponseEntity.ok(clinicalService.getPatientProfile(userId(authentication)));
    }

    @PutMapping
    public ResponseEntity<PatientProfileDto> updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdatePatientProfileRequest request
    ) {
        return ResponseEntity.ok(clinicalService.updatePatientProfile(userId(authentication), request));
    }

    @GetMapping("/allergies")
    public ResponseEntity<List<AllergyDto>> getAllergies(Authentication authentication) {
        return ResponseEntity.ok(clinicalService.getAllergies(userId(authentication)));
    }

    @PostMapping("/allergies")
    public ResponseEntity<AllergyDto> createAllergy(
            Authentication authentication,
            @Valid @RequestBody AllergyRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clinicalService.createAllergy(userId(authentication), request));
    }

    @PutMapping("/allergies/{id}")
    public ResponseEntity<AllergyDto> updateAllergy(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody AllergyRequest request
    ) {
        return ResponseEntity.ok(clinicalService.updateAllergy(userId(authentication), id, request));
    }

    @DeleteMapping("/allergies/{id}")
    public ResponseEntity<Void> deleteAllergy(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        clinicalService.deleteAllergy(userId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
