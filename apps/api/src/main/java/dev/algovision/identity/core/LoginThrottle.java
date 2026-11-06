package dev.algovision.identity.core;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding-window limit on failed logins per key (the normalized email). In memory, so it is per instance: enough for
 * one Render instance in MVP 1, and the interface stays small enough to move to the database or a cache later.
 * The table is bounded so a flood of random emails cannot exhaust memory.
 */
public final class LoginThrottle {

    private static final int MAX_KEYS = 10_000;

    private final Clock clock;
    private final int maxFailures;
    private final Duration window;
    private final Map<String, Deque<Instant>> failures = new ConcurrentHashMap<>();

    public LoginThrottle(Clock clock, int maxFailures, Duration window) {
        if (maxFailures < 1 || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException("maxFailures must be positive and window must be positive");
        }
        this.clock = clock;
        this.maxFailures = maxFailures;
        this.window = window;
    }

    /** @throws AuthException TOO_MANY_ATTEMPTS when the key has used up its failures in the current window. */
    public void checkAllowed(String key) {
        Deque<Instant> recent = failures.get(key);
        if (recent == null) {
            return;
        }
        synchronized (recent) {
            prune(recent);
            if (recent.size() >= maxFailures) {
                throw new AuthException(AuthException.Code.TOO_MANY_ATTEMPTS, "Too many failed attempts. Try again in a few minutes.");
            }
        }
    }

    public void recordFailure(String key) {
        if (failures.size() >= MAX_KEYS) {
            evictExpired();
            if (failures.size() >= MAX_KEYS) {
                return; // under a flood, stop tracking new keys rather than grow without bound
            }
        }
        Deque<Instant> recent = failures.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (recent) {
            prune(recent);
            recent.addLast(clock.instant());
        }
    }

    public void recordSuccess(String key) {
        failures.remove(key);
    }

    private void prune(Deque<Instant> recent) {
        Instant cutoff = clock.instant().minus(window);
        while (!recent.isEmpty() && !recent.peekFirst().isAfter(cutoff)) {
            recent.removeFirst();
        }
    }

    private void evictExpired() {
        failures.entrySet().removeIf(e -> {
            synchronized (e.getValue()) {
                prune(e.getValue());
                return e.getValue().isEmpty();
            }
        });
    }
}
