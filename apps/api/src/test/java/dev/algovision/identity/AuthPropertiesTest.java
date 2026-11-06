package dev.algovision.identity;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class AuthPropertiesTest {

    private static final String SECRET = "0123456789abcdef0123456789abcdef";
    private static final AuthProperties.Cookie COOKIE = new AuthProperties.Cookie("av_refresh", true, "Lax", "/api/v1/auth");

    private static final AuthProperties.Reset RESET = new AuthProperties.Reset(Duration.ofMinutes(30), "http://localhost:3000/reset-password", 3, Duration.ofHours(1));

    private static AuthProperties make(String secret, Duration access, Duration refresh, int iterations, int failures, Duration window, AuthProperties.Cookie cookie) {
        return new AuthProperties(secret, access, refresh, Duration.ofSeconds(10), iterations, failures, window, cookie, RESET);
    }

    private static AuthProperties valid() {
        return make(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), 600_000, 5, Duration.ofMinutes(15), COOKIE);
    }

    @Test
    void acceptsTheDefaults() {
        assertEquals("av_refresh", valid().refreshCookie().name());
    }

    @Test
    void refusesToStartWithoutAStrongSecret() {
        assertThrows(IllegalArgumentException.class, () -> make(null, Duration.ofMinutes(15), Duration.ofDays(14), 600_000, 5, Duration.ofMinutes(15), COOKIE));
        assertThrows(IllegalArgumentException.class, () -> make("short", Duration.ofMinutes(15), Duration.ofDays(14), 600_000, 5, Duration.ofMinutes(15), COOKIE));
    }

    @Test
    void validatesLifetimes() {
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ZERO, Duration.ofDays(14), 600_000, 5, Duration.ofMinutes(15), COOKIE));
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ofHours(2), Duration.ofDays(14), 600_000, 5, Duration.ofMinutes(15), COOKIE));
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ofMinutes(15), Duration.ofMinutes(10), 600_000, 5, Duration.ofMinutes(15), COOKIE));
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ofMinutes(15), Duration.ofDays(91), 600_000, 5, Duration.ofMinutes(15), COOKIE));
    }

    @Test
    void validatesHashingAndThrottleSettings() {
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), 1_000, 5, Duration.ofMinutes(15), COOKIE));
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), 600_000, 0, Duration.ofMinutes(15), COOKIE));
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), 600_000, 5, Duration.ZERO, COOKIE));
        assertThrows(IllegalArgumentException.class, () -> make(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), 600_000, 5, Duration.ofMinutes(15), null));
    }

    @Test
    void cookieSettingsRejectUnsafeValues() {
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties.Cookie("bad name", true, "Lax", "/"));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties.Cookie("ok", true, "None", "/"));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties.Cookie("ok", true, "Lax", "api"));
    }

    @Test
    void validatesResetSettings() {
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties.Reset(Duration.ZERO, "http://x.test/r", 3, Duration.ofHours(1)));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties.Reset(Duration.ofDays(2), "http://x.test/r", 3, Duration.ofHours(1)));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties.Reset(Duration.ofMinutes(30), "javascript:alert(1)", 3, Duration.ofHours(1)));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties.Reset(Duration.ofMinutes(30), "http://x.test/r", 0, Duration.ofHours(1)));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), Duration.ofSeconds(10), 600_000, 5, Duration.ofMinutes(15), COOKIE, null));
    }

    @Test
    void validatesTheRefreshGraceWindow() {
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), null, 600_000, 5, Duration.ofMinutes(15), COOKIE, RESET));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), Duration.ofSeconds(-1), 600_000, 5, Duration.ofMinutes(15), COOKIE, RESET));
        assertThrows(IllegalArgumentException.class, () -> new AuthProperties(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), Duration.ofMinutes(5), 600_000, 5, Duration.ofMinutes(15), COOKIE, RESET));
        assertEquals(Duration.ZERO, new AuthProperties(SECRET, Duration.ofMinutes(15), Duration.ofDays(14), Duration.ZERO, 600_000, 5, Duration.ofMinutes(15), COOKIE, RESET).refreshGrace());
    }
}
