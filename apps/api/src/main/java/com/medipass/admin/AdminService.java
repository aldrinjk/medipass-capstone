package com.medipass.admin;

import com.medipass.audit.AccessOutcome;
import com.medipass.audit.PassAccessLog;
import com.medipass.audit.PassAccessLogRepository;
import com.medipass.auth.UserRepository;
import com.medipass.pass.EmergencyPass;
import com.medipass.pass.EmergencyPassRepository;
import com.medipass.pass.PassStatus;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class AdminService {

    private final EmergencyPassRepository emergencyPassRepository;
    private final PassAccessLogRepository passAccessLogRepository;
    private final UserRepository userRepository;

    public AdminService(
            EmergencyPassRepository emergencyPassRepository,
            PassAccessLogRepository passAccessLogRepository,
            UserRepository userRepository
    ) {
        this.emergencyPassRepository = emergencyPassRepository;
        this.passAccessLogRepository = passAccessLogRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AdminMetricsResponse getMetrics() {
        return new AdminMetricsResponse(
                userRepository.count(),
                emergencyPassRepository.count(),
                emergencyPassRepository.countByStatus(PassStatus.ACTIVE),
                emergencyPassRepository.countByStatus(PassStatus.REVOKED),
                emergencyPassRepository.countByStatus(PassStatus.EXPIRED),
                passAccessLogRepository.count(),
                passAccessLogRepository.countByOutcome(AccessOutcome.SUCCESS),
                passAccessLogRepository.countByOutcome(AccessOutcome.EXPIRED),
                passAccessLogRepository.countByOutcome(AccessOutcome.REVOKED),
                passAccessLogRepository.countByOutcome(AccessOutcome.INVALID),
                Instant.now()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminPassSummaryResponse> searchPasses(PassStatus status) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        List<EmergencyPass> passes = status == null
                ? emergencyPassRepository.findAll(sort)
                : emergencyPassRepository.findAllByStatus(status, sort);

        return passes.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AdminAccessLogResponse> searchAccessLogs(AccessOutcome outcome) {
        Sort sort = Sort.by(Sort.Direction.DESC, "accessedAt");
        List<PassAccessLog> logs = outcome == null
                ? passAccessLogRepository.findAll(sort)
                : passAccessLogRepository.findAllByOutcome(outcome, sort);

        return logs.stream().map(this::toResponse).toList();
    }

    private AdminPassSummaryResponse toResponse(EmergencyPass pass) {
        return new AdminPassSummaryResponse(
                pass.getId(),
                pass.getUserId(),
                pass.getStatus(),
                pass.getExpiresAt(),
                pass.getCategories(),
                pass.getCreatedAt(),
                pass.getRevokedAt()
        );
    }

    private AdminAccessLogResponse toResponse(PassAccessLog log) {
        return new AdminAccessLogResponse(
                log.getId(),
                log.getPassId(),
                log.getUserId(),
                log.getOutcome(),
                log.getCorrelationId(),
                log.getAccessedAt()
        );
    }
}
