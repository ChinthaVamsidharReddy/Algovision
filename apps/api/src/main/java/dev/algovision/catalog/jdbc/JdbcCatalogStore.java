package dev.algovision.catalog.jdbc;

import dev.algovision.catalog.core.CatalogStore;
import dev.algovision.platform.jdbc.SqlFiles;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
public class JdbcCatalogStore implements CatalogStore {

    private final JdbcClient jdbc;
    private final String listCategories = SqlFiles.load("catalog", "list-categories");
    private final String listAlgorithms = SqlFiles.load("catalog", "list-algorithms");
    private final String findAlgorithm = SqlFiles.load("catalog", "find-algorithm");
    private final String languages = SqlFiles.load("catalog", "algorithm-languages");

    public JdbcCatalogStore(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategorySummary> categories() {
        return jdbc.sql(listCategories)
                .query((rs, n) -> new CategorySummary(rs.getString("slug"), rs.getString("name"), rs.getString("description"), rs.getInt("algorithm_count")))
                .list();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlgorithmSummary> algorithms() {
        return jdbc.sql(listAlgorithms).query((rs, n) -> summary(rs)).list();
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<AlgorithmDetail> algorithm(String slug) {
        return jdbc.sql(findAlgorithm).param("slug", slug).query((rs, n) -> detail(rs)).optional().map(d -> {
            List<LanguageContent> langs = jdbc.sql(languages).param("slug", slug)
                    .query((rs, n) -> new LanguageContent(rs.getString("code"), rs.getString("display_name"), rs.getString("editor_id"), rs.getString("content_hash")))
                    .list();
            return new AlgorithmDetail(d.summary(), d.learningText(), d.contentVersion(), d.contentHash(), langs);
        });
    }

    private static AlgorithmSummary summary(ResultSet rs) throws SQLException {
        return new AlgorithmSummary(
                rs.getString("slug"), rs.getString("name"), rs.getString("state_kind"), rs.getString("difficulty"), rs.getString("summary"),
                rs.getString("time_complexity"), rs.getString("space_complexity"), rs.getInt("wave"),
                rs.getString("topic_slug"), rs.getString("topic_name"), rs.getString("category_slug"), rs.getString("category_name"));
    }

    private static AlgorithmDetail detail(ResultSet rs) throws SQLException {
        int version = rs.getInt("content_version");
        Integer contentVersion = rs.wasNull() ? null : version;
        return new AlgorithmDetail(summary(rs), rs.getString("learning_text"), contentVersion, rs.getString("content_hash"), List.of());
    }
}
