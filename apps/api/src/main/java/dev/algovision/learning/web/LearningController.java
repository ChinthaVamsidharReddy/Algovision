package dev.algovision.learning.web;

import dev.algovision.identity.core.AuthService;
import dev.algovision.identity.web.BearerToken;
import dev.algovision.learning.core.LearningService;
import dev.algovision.learning.core.LearningStore;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Per-user learning state. Every call needs a valid access token; state-changing calls also pass the Origin check. */
@RestController
@RequestMapping("/api/v1")
public class LearningController {

    public record LanguageBody(String language) {}

    public record PreferencesBody(String language, String theme, Double playbackSpeed) {}

    public record PreferencesView(String language, String theme, double playbackSpeed) {}

    public record ProgressResponse(List<LearningStore.Progress> progress) {}

    public record BookmarksResponse(List<LearningStore.Bookmark> bookmarks) {}

    private final AuthService auth;
    private final LearningService learning;

    public LearningController(AuthService auth, LearningService learning) {
        this.auth = auth;
        this.learning = learning;
    }

    @GetMapping("/me/progress")
    public ResponseEntity<ProgressResponse> progress(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return noStore(new ProgressResponse(learning.progress(user(authorization))));
    }

    @PostMapping("/algorithms/{slug}/view")
    public ResponseEntity<Void> view(
            @PathVariable String slug, @RequestBody(required = false) LanguageBody body,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        learning.recordView(user(authorization), slug, body == null ? null : body.language());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @PostMapping("/algorithms/{slug}/complete")
    public ResponseEntity<Void> complete(
            @PathVariable String slug, @RequestBody(required = false) LanguageBody body,
            @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        learning.complete(user(authorization), slug, body == null ? null : body.language());
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @GetMapping("/me/bookmarks")
    public ResponseEntity<BookmarksResponse> bookmarks(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return noStore(new BookmarksResponse(learning.bookmarks(user(authorization))));
    }

    @PutMapping("/me/bookmarks/{slug}")
    public ResponseEntity<Void> addBookmark(
            @PathVariable String slug, @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        learning.addBookmark(user(authorization), slug);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @DeleteMapping("/me/bookmarks/{slug}")
    public ResponseEntity<Void> removeBookmark(
            @PathVariable String slug, @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        learning.removeBookmark(user(authorization), slug);
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore()).build();
    }

    @GetMapping("/me/preferences")
    public ResponseEntity<PreferencesView> preferences(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return noStore(view(learning.preferences(user(authorization))));
    }

    @PutMapping("/me/preferences")
    public ResponseEntity<PreferencesView> savePreferences(
            @RequestBody PreferencesBody body, @RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return noStore(view(learning.savePreferences(user(authorization), body.language(), body.theme(), body.playbackSpeed())));
    }

    private UUID user(String authorization) {
        return auth.authenticate(BearerToken.extract(authorization)).id();
    }

    private static PreferencesView view(LearningStore.Preferences p) {
        return new PreferencesView(p.language(), p.theme(), p.playbackSpeed());
    }

    private static <T> ResponseEntity<T> noStore(T body) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(body);
    }
}
