package dev.algovision.learning.core;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Persistence for per-user learning state. Every method that takes a slug acts only on PUBLISHED algorithms. */
public interface LearningStore {

    record Progress(String algorithmSlug, String status, String lastLanguage, Instant firstViewedAt, Instant lastViewedAt, Instant completedAt) {}

    record Bookmark(String algorithmSlug, String name, Instant createdAt) {}

    record Preferences(String language, String theme, double playbackSpeed) {}

    Set<String> enabledLanguages();

    /** @return false when no published algorithm has this slug (nothing was written) */
    boolean recordView(UUID userId, String slug, String language, Instant at);

    /** Idempotent: the first completion time is kept. @return false when the slug is unknown */
    boolean markCompleted(UUID userId, String slug, String language, Instant at);

    List<Progress> progress(UUID userId);

    /** Idempotent. @return false when the slug is unknown; true when the bookmark exists afterwards */
    boolean addBookmark(UUID userId, String slug);

    /** Idempotent. Removing a bookmark that is not there is not an error. */
    void removeBookmark(UUID userId, String slug);

    List<Bookmark> bookmarks(UUID userId);

    Optional<Preferences> preferences(UUID userId);

    void savePreferences(UUID userId, Preferences preferences);

    /** Best-effort audit trail row (VIEWED, COMPLETED, BOOKMARKED). */
    void logActivity(UUID userId, String eventType, String slug, Instant at);
}
