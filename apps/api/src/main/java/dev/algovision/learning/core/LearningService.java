package dev.algovision.learning.core;

import java.time.Clock;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

/** Progress, bookmarks and preferences. Validates input, then delegates; the store enforces idempotency. */
public final class LearningService {

    private static final Pattern SLUG = Pattern.compile("^[a-z][a-z0-9-]{0,99}$");
    private static final Set<String> THEMES = Set.of("system", "light", "dark");
    private static final Set<Double> SPEEDS = Set.of(0.5, 1.0, 1.5, 2.0);

    public static final LearningStore.Preferences DEFAULT_PREFERENCES = new LearningStore.Preferences(null, "system", 1.0);

    private final LearningStore store;
    private final Clock clock;

    public LearningService(LearningStore store, Clock clock) {
        this.store = store;
        this.clock = clock;
    }

    public void recordView(UUID userId, String slug, String language) {
        String lang = language(language);
        if (!store.recordView(userId, slug(slug), lang, clock.instant())) {
            throw notFound();
        }
        store.logActivity(userId, "VIEWED", slug, clock.instant());
    }

    public void complete(UUID userId, String slug, String language) {
        String lang = language(language);
        if (!store.markCompleted(userId, slug(slug), lang, clock.instant())) {
            throw notFound();
        }
        store.logActivity(userId, "COMPLETED", slug, clock.instant());
    }

    public List<LearningStore.Progress> progress(UUID userId) {
        return store.progress(userId);
    }

    public void addBookmark(UUID userId, String slug) {
        if (!store.addBookmark(userId, slug(slug))) {
            throw notFound();
        }
        store.logActivity(userId, "BOOKMARKED", slug, clock.instant());
    }

    public void removeBookmark(UUID userId, String slug) {
        store.removeBookmark(userId, slug(slug));
    }

    public List<LearningStore.Bookmark> bookmarks(UUID userId) {
        return store.bookmarks(userId);
    }

    public LearningStore.Preferences preferences(UUID userId) {
        return store.preferences(userId).orElse(DEFAULT_PREFERENCES);
    }

    public LearningStore.Preferences savePreferences(UUID userId, String language, String theme, Double speed) {
        String lang = language(language);
        if (theme == null || !THEMES.contains(theme)) {
            throw invalid("theme must be one of system, light, dark");
        }
        if (speed == null || !SPEEDS.contains(speed)) {
            throw invalid("playbackSpeed must be one of 0.5, 1.0, 1.5, 2.0");
        }
        LearningStore.Preferences saved = new LearningStore.Preferences(lang, theme, speed);
        store.savePreferences(userId, saved);
        return saved;
    }

    /** Null or blank means "no language"; anything else must be an enabled language code. */
    private String language(String language) {
        if (language == null || language.isBlank()) {
            return null;
        }
        if (!store.enabledLanguages().contains(language)) {
            throw invalid("Unknown language \"" + (language.length() > 20 ? language.substring(0, 20) : language) + "\".");
        }
        return language;
    }

    private static String slug(String slug) {
        if (slug == null || !SLUG.matcher(slug).matches()) {
            throw notFound();
        }
        return slug;
    }

    private static LearningException notFound() {
        return new LearningException(LearningException.Code.ALGORITHM_NOT_FOUND, "That algorithm does not exist.");
    }

    private static LearningException invalid(String message) {
        return new LearningException(LearningException.Code.INVALID_INPUT, message);
    }
}
