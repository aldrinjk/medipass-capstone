package com.medipass.relay;

import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/relay")
@ConditionalOnProperty(
        name = "medipass.responder-verification.provider",
        havingValue = "android-relay"
)
public class SmsRelayController {

    private static final String RELAY_KEY_HEADER = "X-MediPass-Relay-Key";

    private final SmsRelayJobService service;

    public SmsRelayController(SmsRelayJobService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public ResponseEntity<SmsRelayStatusResponse> status(
            @RequestHeader(value = RELAY_KEY_HEADER, required = false) String relayKey
    ) {
        return noStore(service.status(relayKey));
    }

    @PostMapping("/sms-jobs/claim")
    public ResponseEntity<SmsRelayJobResponse> claim(
            @RequestHeader(value = RELAY_KEY_HEADER, required = false) String relayKey
    ) {
        Optional<SmsRelayJobResponse> job = service.claimNext(relayKey);
        if (job.isEmpty()) {
            return ResponseEntity.noContent()
                    .cacheControl(CacheControl.noStore())
                    .header("Pragma", "no-cache")
                    .build();
        }
        return noStore(job.get());
    }

    @PostMapping("/sms-jobs/{jobId}/sent")
    public ResponseEntity<Void> sent(
            @PathVariable UUID jobId,
            @RequestHeader(value = RELAY_KEY_HEADER, required = false) String relayKey
    ) {
        service.acknowledgeSent(relayKey, jobId);
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .build();
    }

    @PostMapping("/sms-jobs/{jobId}/failed")
    public ResponseEntity<Void> failed(
            @PathVariable UUID jobId,
            @RequestHeader(value = RELAY_KEY_HEADER, required = false) String relayKey,
            @Valid @RequestBody SmsRelayFailureRequest body
    ) {
        service.acknowledgeFailed(relayKey, jobId, body.error());
        return ResponseEntity.noContent()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .build();
    }

    private <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Referrer-Policy", "no-referrer")
                .body(body);
    }
}
