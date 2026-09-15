package com.medipass.pass;

import com.medipass.sharing.ShareCategory;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EmergencyPassTokenCollisionTests {

    @Test
    void createPassRetriesWhenGeneratedTokenHashAlreadyExists() {
        EmergencyPassRepository repository = mock(EmergencyPassRepository.class);
        PassTokenService passTokenService = mock(PassTokenService.class);
        EmergencyPassService service = new EmergencyPassService(
                repository,
                passTokenService,
                "http://localhost:5173"
        );

        when(passTokenService.generateToken())
                .thenReturn("collision-token", "fresh-token");
        when(passTokenService.hashToken("collision-token"))
                .thenReturn("collision-hash");
        when(passTokenService.hashToken("fresh-token"))
                .thenReturn("fresh-hash");
        when(repository.existsByTokenHash("collision-hash"))
                .thenReturn(true);
        when(repository.existsByTokenHash("fresh-hash"))
                .thenReturn(false);
        when(repository.saveAndFlush(any(EmergencyPass.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreatePassResponse response = service.createPass(
                UUID.randomUUID(),
                new CreatePassRequest(
                        Set.of(ShareCategory.ALLERGIES),
                        Instant.now().plus(1, ChronoUnit.DAYS)
                )
        );

        ArgumentCaptor<EmergencyPass> captor = ArgumentCaptor.forClass(EmergencyPass.class);
        verify(repository).saveAndFlush(captor.capture());
        verify(passTokenService, times(2)).generateToken();

        assertEquals("fresh-hash", captor.getValue().getTokenHash());
        assertTrue(response.publicUrl().endsWith("/fresh-token"));
    }
}
