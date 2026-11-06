package dev.algovision.identity.core;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/** Registration, login, refresh and logout. No framework types: the web layer supplies strings and gets a {@link Session}. */
public final class AuthService {

    /** A password that never matches; hashed once so unknown emails take as long as wrong passwords. */
    private static final String DUMMY_PASSWORD = "not-a-real-password-for-timing";

    private final UserStore users;
    private final PasswordHasher hasher;
    private final AccessTokenService accessTokens;
    private final RefreshTokenService refreshTokens;
    private final LoginThrottle throttle;
    private final Clock clock;
    private final String dummyHash;

    public AuthService(
            UserStore users,
            PasswordHasher hasher,
            AccessTokenService accessTokens,
            RefreshTokenService refreshTokens,
            LoginThrottle throttle,
            Clock clock) {
        this.users = users;
        this.hasher = hasher;
        this.accessTokens = accessTokens;
        this.refreshTokens = refreshTokens;
        this.throttle = throttle;
        this.clock = clock;
        this.dummyHash = hasher.hash(DUMMY_PASSWORD);
    }

    public record Session(
            UserStore.Account account, String accessToken, Instant accessExpiresAt, String refreshToken, Instant refreshExpiresAt) {}

    public Session register(String email, String password, String fullName, String userAgent) {
        Map<String, String> errors = InputRules.validateRegistration(email, password, fullName);
        if (!errors.isEmpty()) {
            throw new AuthException(AuthException.Code.INVALID_INPUT, "Please fix the highlighted fields.", errors);
        }
        String normalized = InputRules.normalizeEmail(email);
        // Existence is checked by the unique constraint inside create(), so two concurrent sign-ups cannot both win.
        UserStore.Account account = users.create(normalized, hasher.hash(password), fullName.strip());
        users.recordLogin(account.id(), clock.instant());
        return open(account, refreshTokens.start(account.id(), userAgent));
    }

    public Session login(String email, String password, String userAgent) {
        String normalized = InputRules.normalizeEmail(email);
        if (normalized == null || password == null || password.length() > InputRules.PASSWORD_MAX) {
            hasher.verify(DUMMY_PASSWORD, dummyHash);
            throw badCredentials();
        }
        throttle.checkAllowed(normalized);
        UserStore.Account account = users.findByEmail(normalized).orElse(null);
        boolean matches = hasher.verify(password, account == null ? dummyHash : account.passwordHash());
        if (account == null || !matches) {
            throttle.recordFailure(normalized);
            throw badCredentials();
        }
        if (!account.active()) {
            // Only revealed after the correct password, so it cannot be used to probe which emails exist.
            throw new AuthException(AuthException.Code.ACCOUNT_DISABLED, "This account has been disabled.");
        }
        throttle.recordSuccess(normalized);
        if (hasher.needsRehash(account.passwordHash())) {
            users.updatePasswordHash(account.id(), hasher.hash(password));
        }
        users.recordLogin(account.id(), clock.instant());
        return open(account, refreshTokens.start(account.id(), userAgent));
    }

    public Session refresh(String refreshToken, String userAgent) {
        RefreshTokenService.Rotation rotation = refreshTokens.rotate(refreshToken, userAgent);
        UserStore.Account account = users.findById(rotation.userId()).orElse(null);
        if (account == null || !account.active()) {
            refreshTokens.revokeAll(rotation.userId());
            throw new AuthException(AuthException.Code.TOKEN_INVALID, "The session is not valid. Please sign in again.");
        }
        return open(account, rotation.next());
    }

    public void logout(String refreshToken) {
        refreshTokens.revoke(refreshToken);
    }

    /** Resolves a bearer token to the current account; roles come from the database, not from the token. */
    public UserStore.Account authenticate(String accessToken) {
        AccessTokenService.Claims claims = accessTokens.verify(accessToken);
        UUID id = claims.userId();
        UserStore.Account account = users.findById(id).orElse(null);
        if (account == null || !account.active()) {
            throw new AuthException(AuthException.Code.TOKEN_INVALID, "The session is not valid. Please sign in again.");
        }
        return account;
    }

    private Session open(UserStore.Account account, RefreshTokenService.Issued refresh) {
        AccessTokenService.Issued access = accessTokens.issue(account.id(), account.roles());
        return new Session(account, access.token(), access.expiresAt(), refresh.rawToken(), refresh.expiresAt());
    }

    private static AuthException badCredentials() {
        return new AuthException(AuthException.Code.INVALID_CREDENTIALS, "The email or password is not correct.");
    }
}
