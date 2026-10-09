package com.medipass.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.medipass.audit.AccessOutcome;
import com.medipass.pass.PassStatus;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Admin-only endpoints (ROLE_ADMIN, enforced in SecurityConfig). Every route
 * here is frozen by docs/api/openapi.yaml - see that file's Admin tag for the
 * authoritative contract.
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;
    private final SyntheaImportService syntheaImportService;

    public AdminController(AdminService adminService, SyntheaImportService syntheaImportService) {
        this.adminService = adminService;
        this.syntheaImportService = syntheaImportService;
    }

    @GetMapping("/metrics")
    public ResponseEntity<AdminMetricsResponse> getMetrics() {
        return ResponseEntity.ok(adminService.getMetrics());
    }

    @GetMapping("/passes")
    public ResponseEntity<List<AdminPassSummaryResponse>> searchPasses(
            @RequestParam(required = false) PassStatus status
    ) {
        return ResponseEntity.ok(adminService.searchPasses(status));
    }

    @GetMapping("/access-logs")
    public ResponseEntity<List<AdminAccessLogResponse>> searchAccessLogs(
            @RequestParam(required = false) AccessOutcome outcome
    ) {
        return ResponseEntity.ok(adminService.searchAccessLogs(outcome));
    }

    @PostMapping("/synthea/import")
    public ResponseEntity<SyntheaImportResponse> importSynthea(
            @RequestBody(required = false) JsonNode payload
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(syntheaImportService.importSyntheticPatients(payload));
    }
}
