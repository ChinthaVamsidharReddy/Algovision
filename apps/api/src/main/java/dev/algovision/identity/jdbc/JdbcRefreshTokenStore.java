package dev.algovision.identity.jdbc;

import dev.algovision.identity.core.RefreshTokenStore;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcRefreshTokenStore implements RefreshTokenStore {

    private final JdbcClient jdbc;
    private final String insert = Sql.load("rt-insert");
    private final String find = Sql.load("rt-find");
    private final String markRotated = Sql.load("rt-mark-rotated");
    private final String revokeFamily = Sql.load("rt-revoke-family");
    private final String revokeUser = Sql.load("rt-revoke-user");

    public JdbcRefreshTokenStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void save(Record r) {
        jdbc.sql(insert)
                .param("id", r.id())
                .param("userId", r.userId())
                .param("familyId", r.familyId())
                .param("tokenHash", r.tokenHash())
                .param("issuedAt", JdbcUserStore.utc(r.issuedAt()))
                .param("expiresAt", JdbcUserStore.utc(r.expiresAt()))
                .param("userAgent", r.userAgent())
                .update();
    }

    @Override
    public Optional<Record> findByHash(String tokenHash) {
        return jdbc.sql(find).param("tokenHash", tokenHash).query(this::row).optional();
    }

    /** One conditional UPDATE: of any number of racing callers, the database lets exactly one change the row. */
    @Override
    public boolean markRotated(UUID id, Instant at) {
        return jdbc.sql(markRotated).param("at", JdbcUserStore.utc(at)).param("id", id).update() == 1;
    }

    @Override
    public int revokeFamily(UUID familyId, Instant at) {
        return jdbc.sql(revokeFamily).param("at", JdbcUserStore.utc(at)).param("familyId", familyId).update();
    }

    @Override
    public int revokeAllForUser(UUID userId, Instant at) {
        return jdbc.sql(revokeUser).param("at", JdbcUserStore.utc(at)).param("userId", userId).update();
    }

    private Record row(ResultSet rs, int n) throws SQLException {
        return new Record(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getObject("family_id", UUID.class),
                rs.getString("token_hash"),
                instant(rs, "issued_at"),
                instant(rs, "expires_at"),
                instant(rs, "rotated_at"),
                instant(rs, "revoked_at"),
                rs.getString("user_agent"));
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime value = rs.getObject(column, OffsetDateTime.class);
        return value == null ? null : value.toInstant();
    }
}
