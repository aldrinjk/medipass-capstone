package com.medipass.pass;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/passes")
public class PublicPassController {

    private final PublicPassService publicPassService;
    private final ResponderVerificationService verificationService;

    public PublicPassController(
            PublicPassService publicPassService,
            ResponderVerificationService verificationService
    ) {
        this.publicPassService = publicPassService;
        this.verificationService = verificationService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<PublicPassResponse> getPublicPass(
            @PathVariable String token,
            @RequestHeader(value = "X-MediPass-Verification", required = false)
            String verificationToken,
            HttpServletRequest request
    ) {
        String responderDevice = responderDevice(request);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Referrer-Policy", "no-referrer")
                .body(publicPassService.getPublicSummary(
                        token,
                        responderDevice,
                        verificationToken
                ));
    }

    @PostMapping("/{token}/verification/start")
    public ResponseEntity<ResponderVerificationStartResponse> startVerification(
            @PathVariable String token,
            @Valid @RequestBody ResponderVerificationStartRequest body,
            HttpServletRequest request
    ) {
        return noStore(verificationService.start(
                token,
                body,
                responderDevice(request)
        ));
    }

    @PostMapping("/{token}/verification/confirm")
    public ResponseEntity<ResponderVerificationSessionResponse> confirmVerification(
            @PathVariable String token,
            @Valid @RequestBody ResponderVerificationConfirmRequest body
    ) {
        return noStore(verificationService.confirm(token, body));
    }

    @PostMapping("/{token}/verification/emergency-override")
    public ResponseEntity<ResponderVerificationSessionResponse> emergencyOverride(
            @PathVariable String token,
            @Valid @RequestBody ResponderEmergencyOverrideRequest body,
            HttpServletRequest request
    ) {
        return noStore(verificationService.emergencyOverride(
                token,
                body,
                responderDevice(request)
        ));
    }

    private String responderDevice(HttpServletRequest request) {
        return ResponderDeviceResolver.resolve(
                request.getHeader("User-Agent"),
                request.getHeader("Sec-CH-UA-Model")
        );
    }

    private <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Referrer-Policy", "no-referrer")
                .body(body);
    }
}
