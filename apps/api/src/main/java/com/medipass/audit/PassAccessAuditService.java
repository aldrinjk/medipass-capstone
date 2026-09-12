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
    public void record(UUID passId, UUID userId, AccessOutcome outcome) {
        String correlationId = MDC.get(CorrelationIdFilter.MDC_KEY);
        repository.save(new PassAccessLog(passId, userId, outcome, correlationId));
    }
}
