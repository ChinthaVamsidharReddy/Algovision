package dev.algovision.catalog.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class CatalogServiceTest {

    private static CatalogStore.AlgorithmSummary summary(String slug, String category) {
        return new CatalogStore.AlgorithmSummary(slug, slug, "array", "BEGINNER", "s", "O(n)", "O(1)", 1, "t", "T", category, category);
    }

    private final List<String> storeCalls = new ArrayList<>();

    private final CatalogStore store = new CatalogStore() {
        @Override
        public List<CategorySummary> categories() {
            return List.of(new CategorySummary("searching", "Searching", "d", 1));
        }

        @Override
        public List<AlgorithmSummary> algorithms() {
            return List.of(summary("linear-search", "searching"), summary("bubble-sort", "sorting"));
        }

        @Override
        public Optional<AlgorithmDetail> algorithm(String slug) {
            storeCalls.add(slug);
            return slug.equals("linear-search")
                    ? Optional.of(new AlgorithmDetail(summary(slug, "searching"), "", 1, "ab".repeat(32), List.of()))
                    : Optional.empty();
        }
    };

    private final CatalogService service = new CatalogService(store);

    @Test
    void filtersByCategoryAndIgnoresBlank() {
        assertEquals(2, service.algorithms(null).size());
        assertEquals(2, service.algorithms("  ").size());
        assertEquals(List.of("bubble-sort"), service.algorithms("sorting").stream().map(CatalogStore.AlgorithmSummary::slug).toList());
        assertTrue(service.algorithms("nope").isEmpty());
    }

    @Test
    void malformedSlugsNeverReachTheStore() {
        for (String slug : new String[] {null, "", "UPPER", "../x", "a b", "-lead", "x".repeat(101)}) {
            assertTrue(service.algorithm(slug).isEmpty());
        }
        assertTrue(storeCalls.isEmpty());
        assertTrue(service.algorithm("linear-search").isPresent());
        assertTrue(service.algorithm("ghost").isEmpty());
        assertEquals(List.of("linear-search", "ghost"), storeCalls);
    }

    @Test
    void etagIsTheQuotedContentHash() {
        var detail = service.algorithm("linear-search").orElseThrow();
        assertEquals("\"" + "ab".repeat(32) + "\"", CatalogService.etag(detail));
        var noHash = new CatalogStore.AlgorithmDetail(detail.summary(), "", null, null, List.of());
        assertNull(CatalogService.etag(noHash));
    }

    @Test
    void ifNoneMatchHandlesListsWeakValidatorsAndWildcard() {
        String etag = "\"abc\"";
        assertTrue(CatalogService.matchesEtag("\"abc\"", etag));
        assertTrue(CatalogService.matchesEtag("\"x\", \"abc\"", etag));
        assertTrue(CatalogService.matchesEtag("W/\"abc\"", etag));
        assertTrue(CatalogService.matchesEtag("*", etag));
        assertFalse(CatalogService.matchesEtag("\"other\"", etag));
        assertFalse(CatalogService.matchesEtag(null, etag));
        assertFalse(CatalogService.matchesEtag("\"abc\"", null));
    }
}
