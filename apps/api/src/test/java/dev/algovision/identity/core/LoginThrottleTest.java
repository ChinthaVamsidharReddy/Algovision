package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.time.Duration;
import org.junit.jupiter.api.Test;

class LoginThrottleTest {

    private final Support.MutableClock clock = new Support.MutableClock();
    private final LoginThrottle throttle = new LoginThrottle(clock, 3, Duration.ofMinutes(15));

    private void fail(String key, int times) {
        for (int i = 0; i < times; i++) {
            throttle.checkAllowed(key);
            throttle.recordFailure(key);
        }
    }

    @Test
    void blocksAfterTheLimitAndOnlyForThatKey() {
        fail("a@x.com", 3);
        assertEquals(AuthException.Code.TOO_MANY_ATTEMPTS, assertThrows(AuthException.class, () -> throttle.checkAllowed("a@x.com")).code());
        throttle.checkAllowed("b@x.com");
    }

    @Test
    void failuresAgeOutOfTheWindow() {
        fail("a@x.com", 3);
        clock.advance(Duration.ofMinutes(15));
        throttle.checkAllowed("a@x.com");
    }

    @Test
    void slidingWindowCountsOnlyRecentFailures() {
        fail("a@x.com", 2);
        clock.advance(Duration.ofMinutes(10));
        fail("a@x.com", 1); // 3 failures within 15 minutes: blocked
        assertThrows(AuthException.class, () -> throttle.checkAllowed("a@x.com"));
        clock.advance(Duration.ofMinutes(6)); // the first two have aged out
        throttle.checkAllowed("a@x.com");
    }

    @Test
    void successClearsTheCounter() {
        fail("a@x.com", 2);
        throttle.recordSuccess("a@x.com");
        fail("a@x.com", 2);
        throttle.checkAllowed("a@x.com");
    }

    @Test
    void staysBoundedUnderAFloodOfDistinctKeys() {
        for (int i = 0; i < 25_000; i++) {
            throttle.recordFailure("k" + i + "@x.com");
        }
        // still functional afterwards and does not throw
        clock.advance(Duration.ofMinutes(20));
        fail("fresh@x.com", 1);
        throttle.checkAllowed("fresh@x.com");
    }
}
