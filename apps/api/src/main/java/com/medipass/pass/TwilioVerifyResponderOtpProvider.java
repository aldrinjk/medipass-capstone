package com.medipass.pass;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Service
@ConditionalOnProperty(
        name = "medipass.responder-verification.provider",
        havingValue = "twilio"
)
public class TwilioVerifyResponderOtpProvider implements ResponderOtpProvider {

    private final RestClient restClient;
    private final String accountSid;
    private final String authToken;
    private final String serviceSid;

    public TwilioVerifyResponderOtpProvider(
            RestClient.Builder builder,
            @Value("${medipass.responder-verification.twilio.account-sid}") String accountSid,
            @Value("${medipass.responder-verification.twilio.auth-token}") String authToken,
            @Value("${medipass.responder-verification.twilio.service-sid}") String serviceSid
    ) {
        this.restClient = builder.baseUrl("https://verify.twilio.com/v2").build();
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.serviceSid = serviceSid;
    }

    @Override
    public void start(String phoneE164) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("To", phoneE164);
        body.add("Channel", "sms");

        try {
            restClient.post()
                    .uri("/Services/{serviceSid}/Verifications", serviceSid)
                    .headers(headers -> headers.setBasicAuth(accountSid, authToken))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new ResponderVerificationException(
                    "Unable to send the verification code. Please try again or use emergency access.",
                    ex
            );
        }
    }

    @Override
    public boolean verify(String phoneE164, String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("To", phoneE164);
        body.add("Code", code);

        try {
            TwilioCheckResponse response = restClient.post()
                    .uri("/Services/{serviceSid}/VerificationCheck", serviceSid)
                    .headers(headers -> headers.setBasicAuth(accountSid, authToken))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(TwilioCheckResponse.class);

            return response != null && "approved".equalsIgnoreCase(response.status());
        } catch (RestClientResponseException ex) {
            if (ex.getStatusCode().is4xxClientError()) {
                return false;
            }
            throw new ResponderVerificationException(
                    "Unable to verify the code right now. Please try again.",
                    ex
            );
        }
    }

    @Override
    public String deliveryMode() {
        return "SMS";
    }

    private record TwilioCheckResponse(String status) {
    }
}
