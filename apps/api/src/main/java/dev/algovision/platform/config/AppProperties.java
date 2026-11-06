package dev.algovision.platform.config;

import java.net.URI;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Typed application settings. Invalid values stop the application at startup rather than weakening
 * a security check at runtime.
 */
@ConfigurationProperties(prefix = "app")
public record AppProperties(List<String> allowedOrigins, OriginCheck originCheck, Roles roles) {

    private static final Pattern ORIGIN = Pattern.compile("^https?://[A-Za-z0-9.-]+(:[0-9]{1,5})?$");

    public AppProperties {
        if (allowedOrigins == null || allowedOrigins.isEmpty()) {
            throw new IllegalArgumentException("app.allowed-origins must list at least one origin");
        }
        for (String origin : allowedOrigins) {
            if (origin == null || !ORIGIN.matcher(origin).matches()) {
                throw new IllegalArgumentException(
                        "app.allowed-origins entries must be exact origins like https://example.com (no path, no wildcard): '"
                                + origin + "'");
            }
        }
        allowedOrigins = List.copyOf(allowedOrigins);
        if (originCheck == null) {
            throw new IllegalArgumentException("app.origin-check must be configured");
        }
        if (roles == null) {
            roles = new Roles(false);
        }
    }

    /** Origins as a set for O(1) exact-match lookups. */
    public Set<String> allowedOriginSet() {
        return Set.copyOf(allowedOrigins);
    }

    public record OriginCheck(boolean enabled, String clientHeader, String clientHeaderValue) {
        public OriginCheck {
            if (enabled && (isBlank(clientHeader) || isBlank(clientHeaderValue))) {
                throw new IllegalArgumentException("app.origin-check client-header and client-header-value are required when enabled");
            }
        }

        private static boolean isBlank(String s) {
            return s == null || s.isBlank();
        }
    }

    public record Roles(boolean instructorEnabled) {}

    /** Reduces a URL to its origin (scheme://host[:port]) or returns null if it is not an absolute http(s) URL. */
    public static String originOf(String url) {
        try {
            URI uri = URI.create(url);
            String scheme = uri.getScheme();
            String host = uri.getHost();
            if (scheme == null || host == null || !(scheme.equals("http") || scheme.equals("https"))) {
                return null;
            }
            return scheme + "://" + host + (uri.getPort() == -1 ? "" : ":" + uri.getPort());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
