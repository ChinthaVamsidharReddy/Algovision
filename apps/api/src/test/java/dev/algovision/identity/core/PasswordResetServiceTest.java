package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class PasswordResetServiceTest {

    private static final String PASSWORD = "tr1cky-Passphrase!";
    private static final String NEW_PASSWORD = "an0ther-Good-Passphrase";

    static final class MemoryResetStore implements PasswordResetStore {
        final Map<UUID, Record> byId = new HashMap<>();

        @Override
        public synchronized void save(Record r) {
            byId.put(r.id(), r);
        }

        @Override
        public synchronized Optional<Record> findByHash(String hash) {
            return byId.values().stream().filter(r -> r.tokenHash().equals(hash)).findFirst();
        }

        @Override
        public synchronized boolean markUsed(UUID id, Instant at) {
            Record r = byId.get(id);
            if (r == null || r.usedAt() != null || !at.isBefore(r.expiresAt())) {
                return false;
            }
            byId.put(id, new Record(r.id(), r.userId(), r.tokenHash(), r.createdAt(), r.expiresAt(), at));
            return true;
        }

        @Override
        public synchronized int invalidateOutstanding(UUID userId, Instant at) {
            int n = 0;
            for (Record r : new ArrayList<>(byId.values())) {
                if (r.userId().equals(userId) && r.usedAt() == null) {
                    byId.put(r.id(), new Record(r.id(), r.userId(), r.tokenHash(), r.createdAt(), r.expiresAt(), at));
                    n++;
                }
            }
            return n;
        }
    }

    static final class RecordingMailer implements Mailer {
        final List<String> urls = new ArrayList<>();
        final List<String> recipients = new ArrayList<>();

        @Override
        public void sendPasswordReset(String toEmail, String fullName, String resetUrl, Instant expiresAt) {
            recipients.add(toEmail);
            urls.add(resetUrl);
        }

        String lastToken() {
            String url = urls.get(urls.size() - 1);
            return url.substring(url.indexOf("token=") + 6);
        }
    }

    private final Support.MutableClock clock = new Support.MutableClock();
    private final Support.MemoryUserStore users = new Support.MemoryUserStore();
    private final Support.MemoryRefreshStore refreshStore = new Support.MemoryRefreshStore();
    private final MemoryResetStore resets = new MemoryResetStore();
    private final RecordingMailer mailer = new RecordingMailer();
    private final Pbkdf2PasswordHasher hasher = new Pbkdf2PasswordHasher(2_000);
    private final AccessTokenService access = new AccessTokenService("0123456789abcdef0123456789abcdef".getBytes(), Duration.ofMinutes(15), clock);
    private final RefreshTokenService refresh = new RefreshTokenService(refreshStore, clock, Duration.ofDays(14), new SecureRandom());
    private final LoginThrottle loginThrottle = new LoginThrottle(clock, 5, Duration.ofMinutes(15));
    private final LoginThrottle requestThrottle = new LoginThrottle(clock, 3, Duration.ofHours(1));
    private final AuthService auth = new AuthService(users, hasher, access, refresh, loginThrottle, clock);
    private final PasswordResetService reset = new PasswordResetService(
            users, resets, hasher, refresh, loginThrottle, requestThrottle, mailer, clock, new SecureRandom(), Duration.ofMinutes(30), "http://localhost:3000/reset-password");

    private AuthService.Session ada() {
        return auth.register("ada@example.com", PASSWORD, "Ada Lovelace", "ua");
    }

    private AuthException.Code codeOf(Runnable action) {
        return assertThrows(AuthException.class, action::run).code();
    }

    @Test
    void knownEmailGetsALinkWithAFreshTokenAndOnlyItsHashIsStored() {
        ada();
        reset.requestReset("  ADA@example.com ");
        assertEquals(List.of("ada@example.com"), mailer.recipients);
        String token = mailer.lastToken();
        assertEquals(43, token.length());
        assertTrue(mailer.urls.get(0).startsWith("http://localhost:3000/reset-password?token="));
        assertTrue(resets.byId.values().stream().noneMatch(r -> r.tokenHash().contains(token)));
        assertEquals(1, resets.byId.size());
    }

    @Test
    void unknownDisabledAndMalformedEmailsGetNoMailAndNoError() {
        var session = ada();
        users.disable(session.account().id());
        reset.requestReset("ada@example.com");
        reset.requestReset("ghost@example.com");
        reset.requestReset("not-an-email");
        reset.requestReset(null);
        assertTrue(mailer.urls.isEmpty());
        assertTrue(resets.byId.isEmpty());
    }

    @Test
    void requestsAreRateLimitedPerEmailForKnownAndUnknownAlike() {
        ada();
        for (int i = 0; i < 3; i++) {
            reset.requestReset("ada@example.com");
            reset.requestReset("ghost@example.com");
        }
        assertEquals(AuthException.Code.TOO_MANY_ATTEMPTS, codeOf(() -> reset.requestReset("ada@example.com")));
        assertEquals(AuthException.Code.TOO_MANY_ATTEMPTS, codeOf(() -> reset.requestReset("ghost@example.com")));
        reset.requestReset("other@example.com");
        clock.advance(Duration.ofHours(1).plusSeconds(1));
        reset.requestReset("ada@example.com");
    }

    @Test
    void resetChangesThePasswordSignsOutEverywhereAndClearsTheLoginLock() {
        var session = ada();
        for (int i = 0; i < 5; i++) {
            assertEquals(AuthException.Code.INVALID_CREDENTIALS, codeOf(() -> auth.login("ada@example.com", "wrong-password-1", "ua")));
        }
        assertEquals(AuthException.Code.TOO_MANY_ATTEMPTS, codeOf(() -> auth.login("ada@example.com", PASSWORD, "ua")));
        reset.requestReset("ada@example.com");
        reset.resetPassword(mailer.lastToken(), NEW_PASSWORD);
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> auth.refresh(session.refreshToken(), "ua")));
        assertEquals(AuthException.Code.INVALID_CREDENTIALS, codeOf(() -> auth.login("ada@example.com", PASSWORD, "ua")));
        assertEquals("ada@example.com", auth.login("ada@example.com", NEW_PASSWORD, "ua").account().email());
    }

    @Test
    void aLinkWorksOnceOnly() {
        ada();
        reset.requestReset("ada@example.com");
        String token = mailer.lastToken();
        reset.resetPassword(token, NEW_PASSWORD);
        assertEquals(AuthException.Code.RESET_TOKEN_INVALID, codeOf(() -> reset.resetPassword(token, "yet-An0ther-Passphrase")));
    }

    @Test
    void aLinkExpires() {
        ada();
        reset.requestReset("ada@example.com");
        String token = mailer.lastToken();
        clock.advance(Duration.ofMinutes(30));
        assertEquals(AuthException.Code.RESET_TOKEN_INVALID, codeOf(() -> reset.resetPassword(token, NEW_PASSWORD)));
    }

    @Test
    void aNewerRequestVoidsTheOlderLink() {
        ada();
        reset.requestReset("ada@example.com");
        String first = mailer.lastToken();
        reset.requestReset("ada@example.com");
        String second = mailer.lastToken();
        assertNotEquals(first, second);
        assertEquals(AuthException.Code.RESET_TOKEN_INVALID, codeOf(() -> reset.resetPassword(first, NEW_PASSWORD)));
        reset.resetPassword(second, NEW_PASSWORD);
    }

    @Test
    void aWeakPasswordIsRejectedWithoutConsumingTheLink() {
        ada();
        reset.requestReset("ada@example.com");
        String token = mailer.lastToken();
        var ex = assertThrows(AuthException.class, () -> reset.resetPassword(token, "short"));
        assertEquals(AuthException.Code.INVALID_INPUT, ex.code());
        assertTrue(ex.fieldErrors().containsKey("password"));
        assertEquals(AuthException.Code.INVALID_INPUT, codeOf(() -> reset.resetPassword(token, null)));
        reset.resetPassword(token, NEW_PASSWORD);
    }

    @Test
    void malformedUnknownAndDisabledAccountTokensAreAllJustInvalid() {
        var session = ada();
        for (String bad : new String[] {null, "", "short", "a".repeat(43), "!".repeat(43), "a".repeat(44)}) {
            assertEquals(AuthException.Code.RESET_TOKEN_INVALID, codeOf(() -> reset.resetPassword(bad, NEW_PASSWORD)));
        }
        reset.requestReset("ada@example.com");
        String token = mailer.lastToken();
        users.disable(session.account().id());
        assertEquals(AuthException.Code.RESET_TOKEN_INVALID, codeOf(() -> reset.resetPassword(token, NEW_PASSWORD)));
    }

    @Test
    void thePasswordMayNotContainTheEmailName() {
        auth.register("lovelace@example.com", PASSWORD, "Ada Lovelace", "ua");
        reset.requestReset("lovelace@example.com");
        var ex = assertThrows(AuthException.class, () -> reset.resetPassword(mailer.lastToken(), "my-Lovelace-12345"));
        assertEquals(AuthException.Code.INVALID_INPUT, ex.code());
    }
}
