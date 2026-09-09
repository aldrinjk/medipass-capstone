package com.medipass.audit;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/patients/me/access-logs")
public class PassAccessLogController {

    private final PassAccessLogService service;

    public PassAccessLogController(PassAccessLogService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<AccessLogResponse>> getAccessLogs(Authentication authentication) {
        return ResponseEntity.ok(service.getLogs(userId(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccessLogResponse> getAccessLog(
            Authentication authentication,
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(service.getLog(userId(authentication), id));
    }

    private UUID userId(Authentication authentication) {
        return UUID.fromString(authentication.getName());
    }
}
