package com.medipass.patient;

import com.medipass.patient.dto.AllergyDto;
import com.medipass.patient.dto.AllergyRequest;
import com.medipass.patient.dto.ConditionDto;
import com.medipass.patient.dto.ConditionRequest;
import com.medipass.patient.dto.MedicationDto;
import com.medipass.patient.dto.MedicationRequest;
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
    public ResponseEntity<Void> deleteAllergy(Authentication authentication, @PathVariable UUID id) {
        clinicalService.deleteAllergy(userId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/medications")
    public ResponseEntity<List<MedicationDto>> getMedications(Authentication authentication) {
        return ResponseEntity.ok(clinicalService.getMedications(userId(authentication)));
    }

    @PostMapping("/medications")
    public ResponseEntity<MedicationDto> createMedication(
            Authentication authentication,
            @Valid @RequestBody MedicationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clinicalService.createMedication(userId(authentication), request));
    }

    @PutMapping("/medications/{id}")
    public ResponseEntity<MedicationDto> updateMedication(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody MedicationRequest request
    ) {
        return ResponseEntity.ok(clinicalService.updateMedication(userId(authentication), id, request));
    }

    @DeleteMapping("/medications/{id}")
    public ResponseEntity<Void> deleteMedication(Authentication authentication, @PathVariable UUID id) {
        clinicalService.deleteMedication(userId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/conditions")
    public ResponseEntity<List<ConditionDto>> getConditions(Authentication authentication) {
        return ResponseEntity.ok(clinicalService.getConditions(userId(authentication)));
    }

    @PostMapping("/conditions")
    public ResponseEntity<ConditionDto> createCondition(
            Authentication authentication,
            @Valid @RequestBody ConditionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(clinicalService.createCondition(userId(authentication), request));
    }

    @PutMapping("/conditions/{id}")
    public ResponseEntity<ConditionDto> updateCondition(
            Authentication authentication,
            @PathVariable UUID id,
            @Valid @RequestBody ConditionRequest request
    ) {
        return ResponseEntity.ok(clinicalService.updateCondition(userId(authentication), id, request));
    }

    @DeleteMapping("/conditions/{id}")
    public ResponseEntity<Void> deleteCondition(Authentication authentication, @PathVariable UUID id) {
        clinicalService.deleteCondition(userId(authentication), id);
        return ResponseEntity.noContent().build();
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
