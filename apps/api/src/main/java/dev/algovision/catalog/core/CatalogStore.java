package dev.algovision.catalog.core;

import java.util.List;
import java.util.Optional;

/** Read-only view of the published catalog. Only PUBLISHED rows are ever returned. */
public interface CatalogStore {

    record CategorySummary(String slug, String name, String description, int algorithmCount) {}

    record AlgorithmSummary(
            String slug, String name, String stateKind, String difficulty, String summary,
            String timeComplexity, String spaceComplexity, int wave,
            String topicSlug, String topicName, String categorySlug, String categoryName) {}

    record LanguageContent(String code, String displayName, String editorId, String contentHash) {}

    /** {@code contentHash} identifies the exact content version (null only if the sync never ran for this algorithm). */
    record AlgorithmDetail(AlgorithmSummary summary, String learningText, Integer contentVersion, String contentHash, List<LanguageContent> languages) {}

    List<CategorySummary> categories();

    List<AlgorithmSummary> algorithms();

    Optional<AlgorithmDetail> algorithm(String slug);
}
