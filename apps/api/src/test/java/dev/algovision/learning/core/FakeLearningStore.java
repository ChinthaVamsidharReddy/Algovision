package dev.algovision.learning.core;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** In-memory store with the same contract as JdbcLearningStore (idempotent writes, unknown slug -> false). */
final class FakeLearningStore implements LearningStore {

    final Set<String> published = new LinkedHashSet<>(Set.of("linear-search", "bubble-sort"));
    final Map<String, Progress> progress = new LinkedHashMap<>();
    final Set<String> bookmarks = new LinkedHashSet<>();
    final List<String> activity = new ArrayList<>();
    final Map<UUID, Preferences> prefs = new LinkedHashMap<>();
    boolean failActivity;

    private static String key(UUID u, String slug) {
        return u + "/" + slug;
    }

    @Override
    public Set<String> enabledLanguages() {
        return Set.of("java", "python", "cpp", "c");
    }

    @Override
    public boolean recordView(UUID userId, String slug, String language, Instant at) {
        if (!published.contains(slug)) {
            return false;
        }
        Progress old = progress.get(key(userId, slug));
        if (old == null) {
            progress.put(key(userId, slug), new Progress(slug, "IN_PROGRESS", language, at, at, null));
        } else {
            Instant last = at.isAfter(old.lastViewedAt()) ? at : old.lastViewedAt();
            progress.put(key(userId, slug), new Progress(slug, old.status(), language != null ? language : old.lastLanguage(), old.firstViewedAt(), last, old.completedAt()));
        }
        return true;
    }

    @Override
    public boolean markCompleted(UUID userId, String slug, String language, Instant at) {
        if (!published.contains(slug)) {
            return false;
        }
        Progress old = progress.get(key(userId, slug));
        Instant first = old == null ? at : old.firstViewedAt();
        Instant done = old != null && old.completedAt() != null ? old.completedAt() : at;
        String lang = language != null ? language : old == null ? null : old.lastLanguage();
        progress.put(key(userId, slug), new Progress(slug, "COMPLETED", lang, first, at, done));
        return true;
    }

    @Override
    public List<Progress> progress(UUID userId) {
        return progress.entrySet().stream().filter(e -> e.getKey().startsWith(userId + "/")).map(Map.Entry::getValue).toList();
    }

    @Override
    public boolean addBookmark(UUID userId, String slug) {
        if (!published.contains(slug)) {
            return false;
        }
        bookmarks.add(key(userId, slug));
        return true;
    }

    @Override
    public void removeBookmark(UUID userId, String slug) {
        bookmarks.remove(key(userId, slug));
    }

    @Override
    public List<Bookmark> bookmarks(UUID userId) {
        return bookmarks.stream().filter(k -> k.startsWith(userId + "/")).map(k -> new Bookmark(k.substring(k.indexOf('/') + 1), "name", Instant.EPOCH)).toList();
    }

    @Override
    public Optional<Preferences> preferences(UUID userId) {
        return Optional.ofNullable(prefs.get(userId));
    }

    @Override
    public void savePreferences(UUID userId, Preferences p) {
        prefs.put(userId, p);
    }

    @Override
    public void logActivity(UUID userId, String eventType, String slug, Instant at) {
        if (!failActivity) {
            activity.add(eventType + ":" + slug);
        }
    }
}
