package com.medipass.pass;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(
        name = "medipass.responder-verification.provider",
        havingValue = "dev",
        matchIfMissing = true
)
public class DevelopmentResponderOtpProvider implements ResponderOtpProvider {

    private final String demoCode;

    public DevelopmentResponderOtpProvider(
            @Value("${medipass.responder-verification.demo-code:123456}") String demoCode
    ) {
        this.demoCode = demoCode;
    }

    @Override
    public void start(String phoneE164) {
        // Development-only provider. No SMS is sent. The code is returned to
        // the responder web UI with an explicit development label.
    }

    @Override
    public boolean verify(String phoneE164, String code) {
        return demoCode.equals(code);
    }

    @Override
    public String deliveryMode() {
        return "DEVELOPMENT";
    }

    @Override
    public String developmentCode() {
        return demoCode;
    }
}
