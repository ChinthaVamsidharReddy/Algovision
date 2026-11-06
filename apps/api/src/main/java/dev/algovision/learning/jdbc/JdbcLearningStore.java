package dev.algovision.learning.jdbc;

import dev.algovision.learning.core.LearningStore;
import dev.algovision.platform.jdbc.SqlFiles;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class JdbcLearningStore implements LearningStore {

    private final JdbcClient jdbc;
    private final String enabledLanguages = SqlFiles.load("catalog", "enabled-languages");
    private final String recordView = SqlFiles.load("learning", "record-view");
    private final String markCompleted = SqlFiles.load("learning", "mark-completed");
    private final String listProgress = SqlFiles.load("learning", "list-progress");
    private final String addBookmark = SqlFiles.load("learning", "add-bookmark");
    private final String removeBookmark = SqlFiles.load("learning", "remove-bookmark");
    private final String listBookmarks = SqlFiles.load("learning", "list-bookmarks");
    private final String getPreferences = SqlFiles.load("learning", "get-preferences");
    private final String putPreferences = SqlFiles.load("learning", "put-preferences");
    private final String logActivity = SqlFiles.load("learning", "log-activity");

    public JdbcLearningStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public Set<String> enabledLanguages() {
        return new LinkedHashSet<>(jdbc.sql(enabledLanguages).query(String.class).list());
    }

    @Override
    public boolean recordView(UUID userId, String slug, String language, Instant at) {
        return returnsRow(jdbc.sql(recordView).param("userId", userId).param("slug", slug).param("language", blank(language)).param("at", utc(at)));
    }

    @Override
    public boolean markCompleted(UUID userId, String slug, String language, Instant at) {
        return returnsRow(jdbc.sql(markCompleted).param("userId", userId).param("slug", slug).param("language", blank(language)).param("at", utc(at)));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Progress> progress(UUID userId) {
        return jdbc.sql(listProgress).param("userId", userId).query((rs, n) -> new Progress(
                rs.getString("algorithm_slug"), rs.getString("status"), rs.getString("last_language_code"),
                instant(rs, "first_viewed_at"), instant(rs, "last_viewed_at"), instant(rs, "completed_at"))).list();
    }

    @Override
    @Transactional
    public boolean addBookmark(UUID userId, String slug) {
        // ON CONFLICT DO NOTHING returns no row for an existing bookmark, so "exists afterwards" is checked separately.
        if (returnsRow(jdbc.sql(addBookmark).param("userId", userId).param("slug", slug))) {
            return true;
        }
        return jdbc.sql(listBookmarks).param("userId", userId).query((rs, n) -> rs.getString("algorithm_slug")).list().contains(slug);
    }

    @Override
    public void removeBookmark(UUID userId, String slug) {
        jdbc.sql(removeBookmark).param("userId", userId).param("slug", slug).query((rs, n) -> 1).list();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Bookmark> bookmarks(UUID userId) {
        return jdbc.sql(listBookmarks).param("userId", userId)
                .query((rs, n) -> new Bookmark(rs.getString("algorithm_slug"), rs.getString("name"), instant(rs, "created_at"))).list();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Preferences> preferences(UUID userId) {
        return jdbc.sql(getPreferences).param("userId", userId)
                .query((rs, n) -> new Preferences(rs.getString("language_code"), rs.getString("theme"), rs.getBigDecimal("playback_speed").doubleValue()))
                .optional();
    }

    @Override
    public void savePreferences(UUID userId, Preferences p) {
        jdbc.sql(putPreferences).param("userId", userId).param("language", blank(p.language())).param("theme", p.theme())
                .param("speed", BigDecimal.valueOf(p.playbackSpeed())).query((rs, n) -> 1).list();
    }

    /** Single autocommit statement on purpose: a failure here must never poison the caller's work. */
    @Override
    public void logActivity(UUID userId, String eventType, String slug, Instant at) {
        try {
            jdbc.sql(logActivity).param("userId", userId).param("eventType", eventType).param("slug", slug).param("at", utc(at)).query((rs, n) -> 1).list();
        } catch (DataAccessException ignored) {
            // The audit trail is best-effort; the learner's action already succeeded.
        }
    }

    private static boolean returnsRow(JdbcClient.StatementSpec spec) {
        return !spec.query((rs, n) -> 1).list().isEmpty();
    }

    private static String blank(String s) {
        return s == null ? "" : s;
    }

    private static OffsetDateTime utc(Instant instant) {
        return OffsetDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        OffsetDateTime t = rs.getObject(column, OffsetDateTime.class);
        return t == null ? null : t.toInstant();
    }
}
