package com.medipass.audit;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class PassAccessLogService {

    private final PassAccessLogRepository repository;

    public PassAccessLogService(PassAccessLogRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AccessLogResponse> getLogs(UUID userId) {
        return repository.findAllByUserIdOrderByAccessedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public AccessLogResponse getLog(UUID userId, UUID logId) {
        return repository.findByIdAndUserId(logId, userId)
                .map(this::toResponse)
                .orElseThrow(AccessLogNotFoundException::new);
    }

    private AccessLogResponse toResponse(PassAccessLog log) {
        return new AccessLogResponse(
                log.getId(),
                log.getPassId(),
                log.getOutcome(),
                log.getAccessedAt()
        );
    }
}
