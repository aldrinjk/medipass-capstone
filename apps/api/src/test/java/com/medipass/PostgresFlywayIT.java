package com.medipass;

import com.medipass.audit.AccessOutcome;
import com.medipass.audit.PassAccessLog;
import com.medipass.audit.PassAccessLogRepository;
import com.medipass.auth.User;
import com.medipass.auth.UserRepository;
import com.medipass.pass.EmergencyPass;
import com.medipass.pass.EmergencyPassRepository;
import com.medipass.sharing.ShareCategory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Milestone-1-class integration coverage (P5): proves Flyway migrations and
 * JPA/Hibernate repository behavior against a real PostgreSQL engine, not
 * just the H2-in-PostgreSQL-compatibility-mode used by the fast unit suite.
 * This is what actually catches a dialect-specific migration mistake before
 * it reaches the hosted Supabase database.
 *
 * Runs on `mvn verify` (see the failsafe-plugin binding in pom.xml), not
 * `mvn test`, and requires a local Docker daemon.
 */
@Testcontainers
@SpringBootTest
class PostgresFlywayIT {

    @Container
    @SuppressWarnings("resource")
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));

    @DynamicPropertySource
    static void jwtProperties(DynamicPropertyRegistry registry) {
        // Not supplied by @ServiceConnection: application.yml still needs a JWT
        // secret and these have no default in the base config.
        registry.add("medipass.jwt.secret", () -> "integration-test-only-secret-at-least-32-bytes-long");
        registry.add("medipass.jwt.access-minutes", () -> "15");
        registry.add("medipass.jwt.refresh-days", () -> "7");
    }

    @TestConfiguration(proxyBeanMethods = false)
    static class ContainerConfiguration {
        @Bean
        @ServiceConnection
        PostgreSQLContainer<?> postgresContainer() {
            return POSTGRES;
        }
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmergencyPassRepository emergencyPassRepository;

    @Autowired
    private PassAccessLogRepository passAccessLogRepository;

    @Test
    void flywayMigrationsApplyCleanlyAgainstRealPostgres() {
        List<String> appliedVersions = jdbcTemplate.queryForList(
                "SELECT version FROM flyway_schema_history WHERE success = true ORDER BY installed_rank",
                String.class
        );

        assertThat(appliedVersions).containsExactly("1", "2", "3", "4", "5", "6");
    }

    @Test
    void repositoriesRoundTripThroughAllFiveTablesAgainstRealPostgres() {
        User user = userRepository.save(new User("integration-it@medipass.test", "test-password-hash"));

        EmergencyPass pass = emergencyPassRepository.save(new EmergencyPass(
                user.getId(),
                "integration-test-token-hash",
                Instant.now().plus(1, ChronoUnit.DAYS),
                Set.of(ShareCategory.ALLERGIES, ShareCategory.EMERGENCY_CONTACT)
        ));

        PassAccessLog log = passAccessLogRepository.save(
                new PassAccessLog(pass.getId(), user.getId(), AccessOutcome.SUCCESS, "it-correlation-1")
        );

        assertThat(userRepository.findById(user.getId())).isPresent();
        assertThat(emergencyPassRepository.findByTokenHash("integration-test-token-hash"))
                .hasValueSatisfying(found -> assertThat(found.getCategories())
                        .containsExactlyInAnyOrder(ShareCategory.ALLERGIES, ShareCategory.EMERGENCY_CONTACT));
        assertThat(passAccessLogRepository.findById(log.getId()))
                .hasValueSatisfying(found -> assertThat(found.getCorrelationId()).isEqualTo("it-correlation-1"));
    }
}
