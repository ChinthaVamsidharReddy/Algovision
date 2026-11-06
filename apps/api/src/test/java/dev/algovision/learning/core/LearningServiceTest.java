package dev.algovision.learning.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class LearningServiceTest {

    private final FakeLearningStore store = new FakeLearningStore();
    private final Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
    private final LearningService service = new LearningService(store, clock);
    private final UUID user = UUID.randomUUID();
    private final UUID other = UUID.randomUUID();

    private static LearningException.Code codeOf(Throwable t) {
        return ((LearningException) t).code();
    }

    @Test
    void viewCreatesInProgressAndLogsActivity() {
        service.recordView(user, "linear-search", "java");
        var p = service.progress(user).get(0);
        assertEquals("IN_PROGRESS", p.status());
        assertEquals("java", p.lastLanguage());
        assertEquals("VIEWED:linear-search", store.activity.get(0));
    }

    @Test
    void blankLanguageKeepsThePreviousOne() {
        service.recordView(user, "linear-search", "python");
        service.recordView(user, "linear-search", "  ");
        service.recordView(user, "linear-search", null);
        assertEquals("python", service.progress(user).get(0).lastLanguage());
    }

    @Test
    void unknownLanguageIsRejectedBeforeAnythingIsWritten() {
        var ex = assertThrows(LearningException.class, () -> service.recordView(user, "linear-search", "cobol"));
        assertEquals(LearningException.Code.INVALID_INPUT, codeOf(ex));
        assertTrue(service.progress(user).isEmpty());
        assertTrue(store.activity.isEmpty());
    }

    @Test
    void unknownOrMalformedSlugIsNotFoundAndNeverReachesStorage() {
        for (String slug : new String[] {"ghost", "../etc", "UPPER", "", null, "a".repeat(200)}) {
            var ex = assertThrows(LearningException.class, () -> service.recordView(user, slug, "java"));
            assertEquals(LearningException.Code.ALGORITHM_NOT_FOUND, codeOf(ex));
        }
        assertTrue(store.activity.isEmpty());
    }

    @Test
    void completingIsIdempotentAndViewingNeverReopens() {
        service.complete(user, "bubble-sort", "c");
        Instant first = service.progress(user).get(0).completedAt();
        service.complete(user, "bubble-sort", "c");
        service.recordView(user, "bubble-sort", "c");
        var p = service.progress(user).get(0);
        assertEquals("COMPLETED", p.status());
        assertEquals(first, p.completedAt());
        assertEquals(1, service.progress(user).size());
    }

    @Test
    void everyStateChangeLeavesAnAuditRow() {
        service.recordView(user, "linear-search", "java");
        service.complete(user, "linear-search", "java");
        service.addBookmark(user, "linear-search");
        assertEquals(java.util.List.of("VIEWED:linear-search", "COMPLETED:linear-search", "BOOKMARKED:linear-search"), store.activity);
    }

    @Test
    void progressIsPerUser() {
        service.recordView(user, "linear-search", "java");
        assertTrue(service.progress(other).isEmpty());
    }

    @Test
    void bookmarksAreIdempotentPerUserAndRemovalOfAMissingOneIsFine() {
        service.addBookmark(user, "linear-search");
        service.addBookmark(user, "linear-search");
        assertEquals(1, service.bookmarks(user).size());
        assertTrue(service.bookmarks(other).isEmpty());
        service.removeBookmark(other, "linear-search");
        assertEquals(1, service.bookmarks(user).size());
        service.removeBookmark(user, "linear-search");
        service.removeBookmark(user, "linear-search");
        assertTrue(service.bookmarks(user).isEmpty());
    }

    @Test
    void bookmarkingAnUnknownAlgorithmIsNotFound() {
        var ex = assertThrows(LearningException.class, () -> service.addBookmark(user, "ghost"));
        assertEquals(LearningException.Code.ALGORITHM_NOT_FOUND, codeOf(ex));
    }

    @Test
    void auditFailureDoesNotUndoTheAction() {
        store.failActivity = true;
        service.addBookmark(user, "linear-search");
        assertEquals(1, service.bookmarks(user).size());
    }

    @Test
    void preferencesDefaultThenSaveAndValidate() {
        assertEquals("system", service.preferences(user).theme());
        assertNull(service.preferences(user).language());
        var saved = service.savePreferences(user, "cpp", "dark", 1.5);
        assertEquals(saved, service.preferences(user));
        assertFalse(service.preferences(other).equals(saved));
    }

    @Test
    void invalidPreferencesAreRejectedAndNothingIsSaved() {
        assertEquals(LearningException.Code.INVALID_INPUT, codeOf(assertThrows(LearningException.class, () -> service.savePreferences(user, "java", "neon", 1.0))));
        assertEquals(LearningException.Code.INVALID_INPUT, codeOf(assertThrows(LearningException.class, () -> service.savePreferences(user, "java", "dark", 3.0))));
        assertEquals(LearningException.Code.INVALID_INPUT, codeOf(assertThrows(LearningException.class, () -> service.savePreferences(user, "java", "dark", null))));
        assertEquals(LearningException.Code.INVALID_INPUT, codeOf(assertThrows(LearningException.class, () -> service.savePreferences(user, "rust", "dark", 1.0))));
        assertEquals(LearningException.Code.INVALID_INPUT, codeOf(assertThrows(LearningException.class, () -> service.savePreferences(user, "java", null, 1.0))));
        assertTrue(store.prefs.isEmpty());
    }
}
