package dev.algovision.catalog.web;

import dev.algovision.catalog.core.CatalogService;
import dev.algovision.catalog.core.CatalogStore;
import dev.algovision.platform.web.ApiException;
import java.time.Duration;
import java.util.List;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public, read-only catalog. The lesson content itself (code, traces) ships in the web bundle; this API provides the
 * catalog structure and the content hashes the web app uses to confirm it holds the version the server publishes.
 */
@RestController
@RequestMapping("/api/v1")
public class CatalogController {

    private static final CacheControl LIST_CACHE = CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic();
    private static final CacheControl DETAIL_CACHE = CacheControl.maxAge(Duration.ofSeconds(60)).cachePublic().mustRevalidate();

    public record CategoriesResponse(List<CatalogStore.CategorySummary> categories) {}

    public record AlgorithmsResponse(List<CatalogStore.AlgorithmSummary> algorithms) {}

    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping("/categories")
    public ResponseEntity<CategoriesResponse> categories() {
        return ResponseEntity.ok().cacheControl(LIST_CACHE).body(new CategoriesResponse(catalog.categories()));
    }

    @GetMapping("/algorithms")
    public ResponseEntity<AlgorithmsResponse> algorithms(@RequestParam(value = "category", required = false) String category) {
        return ResponseEntity.ok().cacheControl(LIST_CACHE).body(new AlgorithmsResponse(catalog.algorithms(category)));
    }

    @GetMapping("/algorithms/{slug}")
    public ResponseEntity<CatalogStore.AlgorithmDetail> algorithm(
            @PathVariable String slug, @RequestHeader(value = HttpHeaders.IF_NONE_MATCH, required = false) String ifNoneMatch) {
        CatalogStore.AlgorithmDetail detail = catalog.algorithm(slug)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ALGORITHM_NOT_FOUND", "That algorithm does not exist."));
        String etag = CatalogService.etag(detail);
        if (CatalogService.matchesEtag(ifNoneMatch, etag)) {
            return ResponseEntity.status(HttpStatus.NOT_MODIFIED).eTag(etag).cacheControl(DETAIL_CACHE).build();
        }
        ResponseEntity.BodyBuilder ok = ResponseEntity.ok().cacheControl(DETAIL_CACHE);
        if (etag != null) {
            ok.eTag(etag);
        }
        return ok.body(detail);
    }
}
