package com.medipass.pass;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public/passes")
public class PublicPassController {

    private final PublicPassService publicPassService;

    public PublicPassController(PublicPassService publicPassService) {
        this.publicPassService = publicPassService;
    }

    @GetMapping("/{token}")
    public ResponseEntity<PublicPassResponse> getPublicPass(
            @PathVariable String token,
            HttpServletRequest request
    ) {
        String responderDevice = ResponderDeviceResolver.resolve(
                request.getHeader("User-Agent"),
                request.getHeader("Sec-CH-UA-Model")
        );

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header("Pragma", "no-cache")
                .header("Referrer-Policy", "no-referrer")
                .body(publicPassService.getPublicSummary(token, responderDevice));
    }
}
