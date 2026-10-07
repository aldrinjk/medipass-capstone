package com.medipass.audit;

import com.medipass.common.CorrelationIdFilter;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class PassAccessAuditService {

    private final PassAccessLogRepository repository;

    public PassAccessAuditService(PassAccessLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            UUID passId,
            UUID userId,
            AccessOutcome outcome,
            String traceCode,
            String responderDevice,
            String responderName,
            String responderRole,
            String responderOrganization,
            String responderPhoneLast4,
            String verificationMethod,
            String verificationNote
    ) {
        String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
        repository.save(new PassAccessLog(
                passId,
                userId,
                outcome,
                correlationId,
                traceCode,
                responderDevice,
                responderName,
                responderRole,
                responderOrganization,
                responderPhoneLast4,
                verificationMethod,
                verificationNote
        ));
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(
            UUID passId,
            UUID userId,
            AccessOutcome outcome,
            String traceCode,
            String responderDevice
    ) {
        record(
                passId,
                userId,
                outcome,
                traceCode,
                responderDevice,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }

    /**
     * Backwards-compatible helper for non-responder callers/tests that do not
     * supply trace metadata.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(UUID passId, UUID userId, AccessOutcome outcome) {
        record(passId, userId, outcome, null, null);
    }
}
