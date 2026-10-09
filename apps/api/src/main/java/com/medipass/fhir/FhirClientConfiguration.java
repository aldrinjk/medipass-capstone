package com.medipass.fhir;

import ca.uhn.fhir.context.FhirContext;
import ca.uhn.fhir.rest.client.api.IGenericClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@Profile("!test")
public class FhirClientConfiguration {

    @Bean
    public FhirContext fhirContext() {
        return FhirContext.forR4();
    }

    @Bean
    public IGenericClient hapiFhirClient(
            FhirContext fhirContext,
            @Value("${medipass.fhir.base-url}") String baseUrl
    ) {
        return fhirContext.newRestfulGenericClient(baseUrl);
    }
}
