package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;

/** A browser reloading mid-refresh keeps the old cookie although the server already rotated it. */
class RefreshGraceTest {

    private final Support.MutableClock clock = new Support.MutableClock();
    private final Support.MemoryRefreshStore store = new Support.MemoryRefreshStore();
    private final RefreshTokenService service = new RefreshTokenService(store, clock, Duration.ofDays(14), new SecureRandom(), Duration.ofSeconds(10));
    private final UUID user = UUID.randomUUID();

    private AuthException.Code codeOf(Runnable action) {
        return assertThrows(AuthException.class, action::run).code();
    }

    @Test
    void anOldTokenStillWorksForTheGraceWindowAndStaysInTheSameFamily() {
        var first = service.start(user, null);
        var lost = service.rotate(first.rawToken(), null).next(); // the response never reached the browser
        clock.advance(Duration.ofSeconds(5));
        var retry = service.rotate(first.rawToken(), null);
        assertEquals(first.familyId(), retry.next().familyId());
        assertNotEquals(lost.rawToken(), retry.next().rawToken());
        assertTrue(store.all().stream().allMatch(r -> r.revokedAt() == null), "nothing is revoked inside the window");
        service.rotate(retry.next().rawToken(), null); // the new token is usable
    }

    @Test
    void afterTheWindowAReplayIsTheftAgainAndKillsTheFamily() {
        var first = service.start(user, null);
        service.rotate(first.rawToken(), null);
        clock.advance(Duration.ofSeconds(10));
        assertEquals(AuthException.Code.TOKEN_REUSED, codeOf(() -> service.rotate(first.rawToken(), null)));
        assertTrue(store.all().stream().allMatch(r -> r.revokedAt() != null));
    }

    @Test
    void aRevokedFamilyGetsNoGrace() {
        var first = service.start(user, null);
        service.rotate(first.rawToken(), null);
        service.revoke(first.rawToken());
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(first.rawToken(), null)));
    }

    @Test
    void graceNeverExtendsPastExpiry() {
        var first = service.start(user, null);
        clock.advance(Duration.ofDays(14).minusSeconds(3));
        service.rotate(first.rawToken(), null);
        clock.advance(Duration.ofSeconds(4)); // inside the window, but the original token has expired
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(first.rawToken(), null)));
    }

    @Test
    void racingRefreshesInsideTheWindowAllSucceedWithoutSigningTheUserOut() throws Exception {
        var issued = service.start(user, null);
        Thread[] pool = new Thread[6];
        java.util.concurrent.atomic.AtomicInteger ok = new java.util.concurrent.atomic.AtomicInteger();
        java.util.concurrent.CountDownLatch go = new java.util.concurrent.CountDownLatch(1);
        for (int i = 0; i < pool.length; i++) {
            pool[i] = new Thread(() -> {
                try {
                    go.await();
                    service.rotate(issued.rawToken(), null);
                    ok.incrementAndGet();
                } catch (AuthException | InterruptedException e) {
                    // counted by ok
                }
            });
            pool[i].start();
        }
        go.countDown();
        for (Thread t : pool) {
            t.join();
        }
        assertEquals(pool.length, ok.get());
        assertTrue(store.all().stream().allMatch(r -> r.revokedAt() == null));
    }

    @Test
    void zeroGraceKeepsStrictBehaviourAndTheLimitIsValidated() {
        var strict = new RefreshTokenService(store, clock, Duration.ofDays(14), new SecureRandom(), Duration.ZERO);
        var t = strict.start(user, null);
        strict.rotate(t.rawToken(), null);
        assertEquals(AuthException.Code.TOKEN_REUSED, codeOf(() -> strict.rotate(t.rawToken(), null)));
        assertThrows(IllegalArgumentException.class, () -> new RefreshTokenService(store, clock, Duration.ofDays(14), new SecureRandom(), Duration.ofMinutes(5)));
        assertThrows(IllegalArgumentException.class, () -> new RefreshTokenService(store, clock, Duration.ofDays(14), new SecureRandom(), Duration.ofSeconds(-1)));
    }

    @Test
    void losingTheMarkRotatedRaceInsideTheWindowYieldsASiblingNotTheft() {
        // The read still shows the token unused, but another request consumes it before our conditional update.
        var raced = new Support.MemoryRefreshStore() {
            @Override
            public synchronized java.util.Optional<Record> findByHash(String hash) {
                var found = super.findByHash(hash);
                found.ifPresent(r -> super.markRotated(r.id(), clock.instant()));
                return found.map(r -> new Record(r.id(), r.userId(), r.familyId(), r.tokenHash(), r.issuedAt(), r.expiresAt(), null, null, r.userAgent()));
            }
        };
        var svc = new RefreshTokenService(raced, clock, Duration.ofDays(14), new SecureRandom(), Duration.ofSeconds(10));
        var strict = new RefreshTokenService(raced, clock, Duration.ofDays(14), new SecureRandom());
        var a = svc.start(user, null);
        assertEquals(a.familyId(), svc.rotate(a.rawToken(), null).next().familyId());
        assertTrue(raced.all().stream().allMatch(r -> r.revokedAt() == null));
        var b = strict.start(user, null);
        assertEquals(AuthException.Code.TOKEN_REUSED, codeOf(() -> strict.rotate(b.rawToken(), null)));
    }
}
