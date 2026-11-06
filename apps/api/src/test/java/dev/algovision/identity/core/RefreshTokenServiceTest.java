package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class RefreshTokenServiceTest {

    private final Support.MutableClock clock = new Support.MutableClock();
    private final Support.MemoryRefreshStore store = new Support.MemoryRefreshStore();
    private final RefreshTokenService service = new RefreshTokenService(store, clock, Duration.ofDays(14), new SecureRandom());
    private final UUID user = UUID.randomUUID();

    private AuthException.Code codeOf(Runnable action) {
        return assertThrows(AuthException.class, action::run).code();
    }

    @Test
    void storesOnlyTheHashAndTheRawTokenLooksRandom() {
        var issued = service.start(user, "agent");
        assertEquals(43, issued.rawToken().length());
        var record = store.all().get(0);
        assertEquals(RefreshTokenService.hash(issued.rawToken()), record.tokenHash());
        assertTrue(record.tokenHash().matches("^[0-9a-f]{64}$"));
        assertFalse(record.tokenHash().contains(issued.rawToken()));
        assertNotEquals(issued.rawToken(), service.start(user, null).rawToken());
    }

    @Test
    void rotationKeepsTheFamilyAndConsumesTheOldToken() {
        var first = service.start(user, "a");
        var rotation = service.rotate(first.rawToken(), "b");
        assertEquals(user, rotation.userId());
        assertEquals(first.familyId(), rotation.next().familyId());
        assertNotEquals(first.rawToken(), rotation.next().rawToken());
        service.rotate(rotation.next().rawToken(), "c"); // the new token works
    }

    @Test
    void replayingAConsumedTokenRevokesTheWholeFamily() {
        var first = service.start(user, null);
        var second = service.rotate(first.rawToken(), null).next();
        assertEquals(AuthException.Code.TOKEN_REUSED, codeOf(() -> service.rotate(first.rawToken(), null)));
        // the legitimate newer token is now dead too: the thief and the owner are both logged out
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(second.rawToken(), null)));
        assertTrue(store.all().stream().allMatch(r -> r.revokedAt() != null));
    }

    @Test
    void otherFamiliesAndUsersAreUntouchedByReuse() {
        var mine = service.start(user, null);
        var otherDevice = service.start(user, null);
        var stranger = service.start(UUID.randomUUID(), null);
        service.rotate(mine.rawToken(), null);
        assertThrows(AuthException.class, () -> service.rotate(mine.rawToken(), null));
        service.rotate(otherDevice.rawToken(), null);
        service.rotate(stranger.rawToken(), null);
    }

    @Test
    void expiredTokensAreRejectedWithoutRevokingAnything() {
        var issued = service.start(user, null);
        clock.advance(Duration.ofDays(14));
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(issued.rawToken(), null)));
        assertTrue(store.all().stream().allMatch(r -> r.revokedAt() == null && r.rotatedAt() == null));
    }

    @Test
    void unknownAndMalformedTokensAreInvalid() {
        for (String bad : new String[] {null, "", "short", "!".repeat(43), "a".repeat(44), "a".repeat(43)}) {
            assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(bad, null)), String.valueOf(bad));
        }
    }

    @Test
    void logoutRevokesTheFamilyAndIsIdempotent() {
        var issued = service.start(user, null);
        var next = service.rotate(issued.rawToken(), null).next();
        service.revoke(next.rawToken());
        service.revoke(next.rawToken());
        service.revoke("garbage");
        service.revoke(null);
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(next.rawToken(), null)));
    }

    @Test
    void revokeAllEndsEverySessionOfTheUser() {
        var a = service.start(user, null);
        var b = service.start(user, null);
        service.revokeAll(user);
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(a.rawToken(), null)));
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> service.rotate(b.rawToken(), null)));
    }

    @Test
    void longUserAgentsAreTruncated() {
        service.start(user, "x".repeat(1000));
        assertEquals(300, store.all().get(0).userAgent().length());
    }

    @Test
    void concurrentRefreshesWithOneTokenYieldExactlyOneWinner() throws Exception {
        for (int round = 0; round < 20; round++) {
            var issued = service.start(UUID.randomUUID(), null);
            int threads = 8;
            CountDownLatch go = new CountDownLatch(1);
            AtomicInteger wins = new AtomicInteger();
            AtomicInteger reuse = new AtomicInteger();
            Thread[] pool = new Thread[threads];
            for (int i = 0; i < threads; i++) {
                pool[i] = new Thread(() -> {
                    try {
                        go.await();
                        service.rotate(issued.rawToken(), null);
                        wins.incrementAndGet();
                    } catch (AuthException e) {
                        reuse.incrementAndGet();
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                });
                pool[i].start();
            }
            go.countDown();
            for (Thread t : pool) {
                t.join();
            }
            assertEquals(1, wins.get(), "exactly one refresh may succeed");
            assertEquals(threads - 1, reuse.get());
        }
    }
}
