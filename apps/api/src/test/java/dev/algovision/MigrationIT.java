package dev.algovision;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Boots the real application against PostgreSQL 16 so Flyway applies V1..V6 and Hibernate validates the
 * result. Needs Docker; runs in `mvn verify` (failsafe), not in plain `mvn test`.
 * infra/db/verify.sql holds the deeper constraint checks and is also run in CI.
 */
@Testcontainers
@SpringBootTest
class MigrationIT {

    @Container
    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void flywayCreatesTheTwentyTablesAndSeedsRoles() {
        Integer tables = jdbc.queryForObject(
                "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' "
                        + "AND table_type = 'BASE TABLE' AND table_name <> 'flyway_schema_history'",
                Integer.class);
        assertEquals(20, tables);

        List<String> roles = jdbc.queryForList("SELECT name FROM roles ORDER BY name", String.class);
        assertEquals(List.of("ROLE_ADMIN", "ROLE_STUDENT"), roles, "ROLE_INSTRUCTOR must not exist in MVP 1");
    }

    @Test
    void emailUniquenessIsCaseInsensitive() {
        jdbc.update("INSERT INTO users (email, password_hash, full_name) VALUES ('Case@Example.com', 'x', 'A')");
        assertThrows(DataIntegrityViolationException.class,
                () -> jdbc.update("INSERT INTO users (email, password_hash, full_name) VALUES ('case@example.COM', 'x', 'B')"));
    }
}
