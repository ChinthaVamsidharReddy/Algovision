package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.Set;
import org.junit.jupiter.api.Test;

class AuthServiceTest {

    private static final String PASSWORD = "tr1cky-Passphrase!";
    private final Support.MutableClock clock = new Support.MutableClock();
    private final Support.MemoryUserStore users = new Support.MemoryUserStore();
    private final Support.MemoryRefreshStore refreshStore = new Support.MemoryRefreshStore();
    private final Pbkdf2PasswordHasher hasher = new Pbkdf2PasswordHasher(2_000);
    private final AccessTokenService access = new AccessTokenService("0123456789abcdef0123456789abcdef".getBytes(), Duration.ofMinutes(15), clock);
    private final RefreshTokenService refresh = new RefreshTokenService(refreshStore, clock, Duration.ofDays(14), new SecureRandom());
    private final LoginThrottle throttle = new LoginThrottle(clock, 5, Duration.ofMinutes(15));
    private final AuthService auth = new AuthService(users, hasher, access, refresh, throttle, clock);

    private AuthException.Code codeOf(Runnable action) {
        return assertThrows(AuthException.class, action::run).code();
    }

    @Test
    void registerCreatesAStudentAndSignsThemIn() {
        var session = auth.register("  Ada@Example.com ", PASSWORD, " Ada Lovelace ", "ua");
        assertEquals("ada@example.com", session.account().email());
        assertEquals("Ada Lovelace", session.account().fullName());
        assertEquals(Set.of("ROLE_STUDENT"), session.account().roles());
        assertNotEquals(PASSWORD, session.account().passwordHash());
        assertTrue(hasher.verify(PASSWORD, session.account().passwordHash()));
        assertEquals(session.account().id(), auth.authenticate(session.accessToken()).id());
        assertEquals(1, users.logins);
    }

    @Test
    void registerReportsEveryInvalidFieldAndCreatesNothing() {
        var e = assertThrows(AuthException.class, () -> auth.register("bad", "short", "", null));
        assertEquals(AuthException.Code.INVALID_INPUT, e.code());
        assertEquals(Set.of("email", "password", "fullName"), e.fieldErrors().keySet());
        assertTrue(users.byId.isEmpty());
    }

    @Test
    void duplicateEmailsDifferingOnlyInCaseAreRejected() {
        auth.register("ada@example.com", PASSWORD, "Ada", null);
        assertEquals(AuthException.Code.EMAIL_TAKEN, codeOf(() -> auth.register("ADA@example.com", PASSWORD, "Other", null)));
        assertEquals(1, users.byId.size());
    }

    @Test
    void loginWorksCaseInsensitivelyAndRejectsWrongPasswordsWithOneMessage() {
        auth.register("ada@example.com", PASSWORD, "Ada", null);
        assertEquals("ada@example.com", auth.login("ADA@example.com", PASSWORD, null).account().email());
        var wrongPassword = assertThrows(AuthException.class, () -> auth.login("ada@example.com", "wrong-password-1", null));
        var unknownEmail = assertThrows(AuthException.class, () -> auth.login("nobody@example.com", PASSWORD, null));
        var malformed = assertThrows(AuthException.class, () -> auth.login("not an email", PASSWORD, null));
        assertEquals(AuthException.Code.INVALID_CREDENTIALS, wrongPassword.code());
        assertEquals(wrongPassword.getMessage(), unknownEmail.getMessage(), "no hint about which part was wrong");
        assertEquals(wrongPassword.getMessage(), malformed.getMessage());
    }

    @Test
    void tooManyFailuresLockTheEmailTemporarilyEvenForTheRightPassword() {
        auth.register("ada@example.com", PASSWORD, "Ada", null);
        for (int i = 0; i < 5; i++) {
            assertEquals(AuthException.Code.INVALID_CREDENTIALS, codeOf(() -> auth.login("ada@example.com", "wrong-password-1", null)));
        }
        assertEquals(AuthException.Code.TOO_MANY_ATTEMPTS, codeOf(() -> auth.login("ada@example.com", PASSWORD, null)));
        clock.advance(Duration.ofMinutes(16));
        auth.login("ada@example.com", PASSWORD, null);
    }

    @Test
    void unknownEmailsAreThrottledToo() {
        for (int i = 0; i < 5; i++) {
            codeOf(() -> auth.login("ghost@example.com", "whatever-password", null));
        }
        assertEquals(AuthException.Code.TOO_MANY_ATTEMPTS, codeOf(() -> auth.login("ghost@example.com", "whatever-password", null)));
    }

    @Test
    void disabledAccountsGetAGenericErrorUnlessThePasswordIsRight() {
        var s = auth.register("ada@example.com", PASSWORD, "Ada", null);
        users.disable(s.account().id());
        assertEquals(AuthException.Code.INVALID_CREDENTIALS, codeOf(() -> auth.login("ada@example.com", "wrong-password-1", null)));
        assertEquals(AuthException.Code.ACCOUNT_DISABLED, codeOf(() -> auth.login("ada@example.com", PASSWORD, null)));
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> auth.authenticate(s.accessToken())));
    }

    @Test
    void refreshRotatesAndEndsTheSessionWhenTheAccountIsDisabled() {
        var s = auth.register("ada@example.com", PASSWORD, "Ada", null);
        var again = auth.refresh(s.refreshToken(), null);
        assertNotEquals(s.refreshToken(), again.refreshToken());
        assertEquals(s.account().id(), auth.authenticate(again.accessToken()).id());
        users.disable(s.account().id());
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> auth.refresh(again.refreshToken(), null)));
        assertTrue(refreshStore.all().stream().allMatch(r -> r.revokedAt() != null));
    }

    @Test
    void logoutMakesTheRefreshTokenUseless() {
        var s = auth.register("ada@example.com", PASSWORD, "Ada", null);
        auth.logout(s.refreshToken());
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> auth.refresh(s.refreshToken(), null)));
        auth.logout(s.refreshToken()); // idempotent
    }

    @Test
    void weakStoredHashesAreUpgradedAtLogin() {
        var weak = new AuthService(users, new Pbkdf2PasswordHasher(1_000), access, refresh, throttle, clock);
        weak.register("ada@example.com", PASSWORD, "Ada", null);
        auth.login("ada@example.com", PASSWORD, null);
        assertEquals(1, users.rehashes);
        assertTrue(users.findByEmail("ada@example.com").orElseThrow().passwordHash().startsWith("pbkdf2-sha256$2000$"));
        auth.login("ada@example.com", PASSWORD, null);
        assertEquals(1, users.rehashes, "already current: no second rehash");
    }

    @Test
    void anExpiredAccessTokenIsRejectedButTheRefreshTokenStillWorks() {
        var s = auth.register("ada@example.com", PASSWORD, "Ada", null);
        clock.advance(Duration.ofMinutes(16));
        assertEquals(AuthException.Code.TOKEN_INVALID, codeOf(() -> auth.authenticate(s.accessToken())));
        var renewed = auth.refresh(s.refreshToken(), null);
        assertFalse(renewed.accessToken().isEmpty());
        assertEquals(s.account().id(), auth.authenticate(renewed.accessToken()).id());
    }
}
