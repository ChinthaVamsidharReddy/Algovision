package dev.algovision.platform.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class AppPropertiesTest {

    private static final AppProperties.OriginCheck CHECK = new AppProperties.OriginCheck(true, "X-AlgoVision-Client", "web");

    @Test
    void acceptsExactOrigins() {
        AppProperties p = new AppProperties(List.of("https://algovision.example", "http://localhost:3000"), CHECK, null);
        assertTrue(p.allowedOriginSet().contains("http://localhost:3000"));
        assertFalse(p.roles().instructorEnabled(), "instructor must default to disabled");
    }

    @ParameterizedTest
    @ValueSource(strings = {"*", "https://*.example.com", "https://example.com/", "https://example.com/path", "example.com", "ftp://example.com", "", "https://exa mple.com"})
    void rejectsMalformedOrigins(String origin) {
        assertThrows(IllegalArgumentException.class, () -> new AppProperties(List.of(origin), CHECK, null));
    }

    @Test
    void rejectsEmptyList() {
        assertThrows(IllegalArgumentException.class, () -> new AppProperties(List.of(), CHECK, null));
        assertThrows(IllegalArgumentException.class, () -> new AppProperties(null, CHECK, null));
    }

    @Test
    void requiresClientHeaderWhenCheckEnabled() {
        assertThrows(IllegalArgumentException.class, () -> new AppProperties.OriginCheck(true, "", "web"));
        assertThrows(IllegalArgumentException.class, () -> new AppProperties.OriginCheck(true, "X-A", null));
        new AppProperties.OriginCheck(false, null, null); // fine when disabled
    }

    @Test
    void originOfReducesUrlsToOrigins() {
        assertEquals("https://a.example", AppProperties.originOf("https://a.example/some/path?q=1"));
        assertEquals("http://localhost:3000", AppProperties.originOf("http://localhost:3000/algorithms"));
        assertNull(AppProperties.originOf("not a url"));
        assertNull(AppProperties.originOf("javascript:alert(1)"));
        assertNull(AppProperties.originOf("file:///etc/passwd"));
    }
}
