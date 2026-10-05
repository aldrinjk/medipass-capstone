package com.medipass.pass;

import com.medipass.audit.AccessOutcome;
import com.medipass.audit.PassAccessAuditService;
import com.medipass.patient.ClinicalService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PublicPassAuditFailureTests {

    @Mock
    private EmergencyPassRepository repository;

    @Mock
    private PassTokenService passTokenService;

    @Mock
    private ClinicalService clinicalService;

    @Mock
    private PassAccessAuditService auditService;

    @Test
    void successfulSummaryStillReturnsWhenAuditStoreFails() {
        UUID passId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        EmergencyPass pass = mock(EmergencyPass.class);

        when(passTokenService.hashToken("raw-token")).thenReturn("hash");
        when(repository.findByTokenHash("hash")).thenReturn(Optional.of(pass));
        when(pass.getId()).thenReturn(passId);
        when(pass.getUserId()).thenReturn(userId);
        when(pass.getStatus()).thenReturn(PassStatus.ACTIVE);
        when(pass.getExpiresAt()).thenReturn(Instant.now().plusSeconds(3600));
        when(pass.getCategories()).thenReturn(Collections.emptySet());
        doThrow(new RuntimeException("audit unavailable"))
                .when(auditService)
                .record(passId, userId, AccessOutcome.SUCCESS);

        PublicPassService service = new PublicPassService(
                repository,
                passTokenService,
                clinicalService,
                auditService
        );

        PublicPassResponse response = service.getPublicSummary("raw-token");

        assertThat(response.passId()).isEqualTo(passId);
        assertThat(response.categories()).isEmpty();
    }

    @Test
    void invalidTokenStillReturnsNotFoundWhenAuditStoreFails() {
        when(passTokenService.hashToken("invalid")).thenReturn("missing-hash");
        when(repository.findByTokenHash("missing-hash")).thenReturn(Optional.empty());
        doThrow(new RuntimeException("audit unavailable"))
                .when(auditService)
                .record(null, null, AccessOutcome.INVALID);

        PublicPassService service = new PublicPassService(
                repository,
                passTokenService,
                clinicalService,
                auditService
        );

        assertThatThrownBy(() -> service.getPublicSummary("invalid"))
                .isInstanceOf(PublicPassNotFoundException.class);
    }
}
