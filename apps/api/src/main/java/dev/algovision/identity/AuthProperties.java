package dev.algovision.identity;

import java.time.Duration;
import java.util.Set;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Authentication settings. There is deliberately no default for the token secret: the application refuses to start
 * without one rather than run with a guessable key.
 */
@ConfigurationProperties(prefix = "auth")
public record AuthProperties(
        String tokenSecret,
        Duration accessTtl,
        Duration refreshTtl,
        Duration refreshGrace,
        int passwordIterations,
        int loginMaxFailures,
        Duration loginWindow,
        Cookie refreshCookie,
        Reset reset) {

    /** Password-reset links: token lifetime, the web page that receives the token, and a per-email request limit. */
    public record Reset(Duration ttl, String url, int maxRequests, Duration window) {
        public Reset {
            if (ttl == null || ttl.isZero() || ttl.isNegative() || ttl.compareTo(Duration.ofHours(24)) > 0) {
                throw new IllegalArgumentException("auth.reset.ttl must be positive and at most 24 hours");
            }
            if (url == null || !url.matches("^https?://[^\\s]+$")) {
                throw new IllegalArgumentException("auth.reset.url must be an absolute http(s) URL");
            }
            if (maxRequests < 1 || window == null || window.isZero() || window.isNegative()) {
                throw new IllegalArgumentException("auth.reset.max-requests and auth.reset.window must be positive");
            }
        }
    }


    public record Cookie(String name, boolean secure, String sameSite, String path) {
        public Cookie {
            if (name == null || !name.matches("^[A-Za-z0-9_]{1,40}$")) {
                throw new IllegalArgumentException("auth.refresh-cookie.name must be 1-40 letters, digits or underscores");
            }
            if (!Set.of("Lax", "Strict").contains(sameSite)) {
                throw new IllegalArgumentException("auth.refresh-cookie.same-site must be Lax or Strict (None is not allowed)");
            }
            if (path == null || !path.startsWith("/")) {
                throw new IllegalArgumentException("auth.refresh-cookie.path must start with /");
            }
        }
    }

    public AuthProperties {
        if (tokenSecret == null || tokenSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length < 32) {
            throw new IllegalArgumentException("auth.token-secret (env AUTH_TOKEN_SECRET) must be set to at least 32 bytes of random data");
        }
        if (accessTtl == null || accessTtl.isNegative() || accessTtl.isZero() || accessTtl.compareTo(Duration.ofHours(1)) > 0) {
            throw new IllegalArgumentException("auth.access-ttl must be positive and at most 1 hour");
        }
        if (refreshTtl == null || refreshTtl.compareTo(accessTtl) <= 0 || refreshTtl.compareTo(Duration.ofDays(90)) > 0) {
            throw new IllegalArgumentException("auth.refresh-ttl must be longer than the access TTL and at most 90 days");
        }
        if (refreshGrace == null || refreshGrace.isNegative() || refreshGrace.compareTo(Duration.ofMinutes(1)) > 0) {
            throw new IllegalArgumentException("auth.refresh-grace must be between 0 and 1 minute");
        }
        if (passwordIterations < 210_000) {
            throw new IllegalArgumentException("auth.password-iterations must be at least 210000");
        }
        if (loginMaxFailures < 1 || loginWindow == null || loginWindow.isNegative() || loginWindow.isZero()) {
            throw new IllegalArgumentException("auth.login-max-failures and auth.login-window must be positive");
        }
        if (refreshCookie == null) {
            throw new IllegalArgumentException("auth.refresh-cookie must be configured");
        }
        if (reset == null) {
            throw new IllegalArgumentException("auth.reset must be configured");
        }
    }
}
