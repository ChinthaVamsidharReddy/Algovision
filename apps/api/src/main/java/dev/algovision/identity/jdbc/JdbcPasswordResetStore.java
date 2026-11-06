package dev.algovision.identity.jdbc;

import dev.algovision.identity.core.PasswordResetStore;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcPasswordResetStore implements PasswordResetStore {

    private final JdbcClient jdbc;
    private final String insert = Sql.load("pr-insert");
    private final String find = Sql.load("pr-find");
    private final String markUsed = Sql.load("pr-mark-used");
    private final String invalidate = Sql.load("pr-invalidate-user");

    public JdbcPasswordResetStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void save(Record r) {
        jdbc.sql(insert)
                .param("id", r.id())
                .param("userId", r.userId())
                .param("tokenHash", r.tokenHash())
                .param("createdAt", JdbcUserStore.utc(r.createdAt()))
                .param("expiresAt", JdbcUserStore.utc(r.expiresAt()))
                .update();
    }

    @Override
    public Optional<Record> findByHash(String tokenHash) {
        return jdbc.sql(find).param("tokenHash", tokenHash).query((rs, n) -> new Record(
                rs.getObject("id", UUID.class),
                rs.getObject("user_id", UUID.class),
                rs.getString("token_hash"),
                rs.getObject("created_at", OffsetDateTime.class).toInstant(),
                rs.getObject("expires_at", OffsetDateTime.class).toInstant(),
                instant(rs.getObject("used_at", OffsetDateTime.class)))).optional();
    }

    /** One conditional UPDATE: of any number of racing callers, exactly one changes the row. */
    @Override
    public boolean markUsed(UUID id, Instant at) {
        return jdbc.sql(markUsed).param("at", JdbcUserStore.utc(at)).param("id", id).update() == 1;
    }

    @Override
    public int invalidateOutstanding(UUID userId, Instant at) {
        return jdbc.sql(invalidate).param("at", JdbcUserStore.utc(at)).param("userId", userId).update();
    }

    private static Instant instant(OffsetDateTime t) {
        return t == null ? null : t.toInstant();
    }
}
