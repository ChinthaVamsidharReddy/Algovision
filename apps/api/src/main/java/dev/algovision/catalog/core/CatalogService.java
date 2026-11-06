package dev.algovision.catalog.core;

import java.util.List;
import java.util.Optional;
import java.util.regex.Pattern;

/** Catalog reads. Slugs are validated before they reach storage so malformed input is a plain "not found". */
public final class CatalogService {

    private static final Pattern SLUG = Pattern.compile("^[a-z][a-z0-9-]{0,99}$");

    private final CatalogStore store;

    public CatalogService(CatalogStore store) {
        this.store = store;
    }

    public List<CatalogStore.CategorySummary> categories() {
        return store.categories();
    }

    /** All published algorithms, optionally narrowed to one category slug (unknown slug -> empty list). */
    public List<CatalogStore.AlgorithmSummary> algorithms(String categorySlug) {
        List<CatalogStore.AlgorithmSummary> all = store.algorithms();
        if (categorySlug == null || categorySlug.isBlank()) {
            return all;
        }
        return all.stream().filter(a -> a.categorySlug().equals(categorySlug)).toList();
    }

    public Optional<CatalogStore.AlgorithmDetail> algorithm(String slug) {
        if (slug == null || !SLUG.matcher(slug).matches()) {
            return Optional.empty();
        }
        return store.algorithm(slug);
    }

    /** Strong ETag for an algorithm response, derived from its content hash; null when there is no hash yet. */
    public static String etag(CatalogStore.AlgorithmDetail detail) {
        return detail.contentHash() == null ? null : "\"" + detail.contentHash().strip() + "\"";
    }

    /** True when an If-None-Match header value (possibly a list, possibly weak) matches the given strong ETag. */
    public static boolean matchesEtag(String ifNoneMatch, String etag) {
        if (ifNoneMatch == null || etag == null) {
            return false;
        }
        for (String candidate : ifNoneMatch.split(",")) {
            String c = candidate.strip();
            if (c.equals("*") || c.equals(etag) || c.equals("W/" + etag)) {
                return true;
            }
        }
        return false;
    }
}
