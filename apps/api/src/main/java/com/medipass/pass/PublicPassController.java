package com.medipass.pass;

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
    public PublicPassResponse getPublicPass(@PathVariable String token) {
        return publicPassService.getPublicSummary(token);
    }
}
