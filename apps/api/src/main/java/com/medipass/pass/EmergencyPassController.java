package com.medipass.pass;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/passes")
public class EmergencyPassController {

    private final EmergencyPassService service;

    public EmergencyPassController(EmergencyPassService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<CreatePassResponse> createPass(
            Authentication authentication,
            @Valid @RequestBody CreatePassRequest request
    ) {
        CreatePassResponse response = service.createPass(
                userId(authentication),
                request
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PassMetadataResponse>> listPasses(Authentication authentication) {
        return ResponseEntity.ok(service.listPasses(userId(authentication)));
    }

    @GetMapping("/{passId}")
    public ResponseEntity<PassMetadataResponse> getPass(
            Authentication authentication,
            @PathVariable UUID passId
    ) {
        return ResponseEntity.ok(service.getPass(userId(authentication), passId));
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
