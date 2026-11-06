package dev.algovision.identity.jdbc;

import dev.algovision.identity.core.AuthException;
import dev.algovision.identity.core.UserStore;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class JdbcUserStore implements UserStore {

    private final JdbcClient jdbc;
    private final String findByEmail = Sql.load("find-user-by-email");
    private final String findById = Sql.load("find-user-by-id");
    private final String roles = Sql.load("user-roles");
    private final String create = Sql.load("create-user");
    private final String recordLogin = Sql.load("record-login");
    private final String updatePassword = Sql.load("update-password");

    public JdbcUserStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Account> findByEmail(String normalizedEmail) {
        return jdbc.sql(findByEmail).param("email", normalizedEmail).query(this::row).optional().map(this::withRoles);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Account> findById(UUID id) {
        return jdbc.sql(findById).param("id", id).query(this::row).optional().map(this::withRoles);
    }

    @Override
    @Transactional
    public Account create(String normalizedEmail, String passwordHash, String fullName) {
        try {
            UUID id = jdbc.sql(create)
                    .param("email", normalizedEmail)
                    .param("hash", passwordHash)
                    .param("name", fullName)
                    .query(UUID.class)
                    .optional()
                    .orElseThrow(() -> new IllegalStateException("ROLE_STUDENT is missing; the account was rolled back"));
            return new Account(id, normalizedEmail, passwordHash, fullName, true, Set.of("ROLE_STUDENT"));
        } catch (DuplicateKeyException e) {
            throw new AuthException(AuthException.Code.EMAIL_TAKEN, "An account with this email already exists.");
        }
    }

    @Override
    public void recordLogin(UUID id, Instant at) {
        jdbc.sql(recordLogin).param("at", utc(at)).param("id", id).update();
    }

    @Override
    public void updatePasswordHash(UUID id, String passwordHash) {
        jdbc.sql(updatePassword).param("hash", passwordHash).param("id", id).update();
    }

    private record Row(UUID id, String email, String hash, String name, boolean active) {}

    private Row row(ResultSet rs, int n) throws SQLException {
        return new Row(
                rs.getObject("id", UUID.class),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("full_name"),
                "ACTIVE".equals(rs.getString("status")));
    }

    private Account withRoles(Row r) {
        Set<String> names = new LinkedHashSet<>(jdbc.sql(roles).param("id", r.id()).query(String.class).list());
        return new Account(r.id(), r.email(), r.hash(), r.name(), r.active(), Set.copyOf(names));
    }

    static OffsetDateTime utc(Instant instant) {
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
