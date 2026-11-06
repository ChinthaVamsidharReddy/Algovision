package dev.algovision.identity.core;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Forgot / reset password. Requesting a reset never reveals whether the email has an account (same outcome either way).
 * Tokens are 32 random bytes, only their SHA-256 is stored, they expire, work once, and a newer request voids older
 * ones. A successful reset signs the user out everywhere (all refresh tokens revoked) and clears the login throttle.
 */
public final class PasswordResetService {

    private static final Pattern RAW_SHAPE = Pattern.compile("^[A-Za-z0-9_-]{43}$");

    private final UserStore users;
    private final PasswordResetStore store;
    private final PasswordHasher hasher;
    private final RefreshTokenService refreshTokens;
    private final LoginThrottle loginThrottle;
    private final LoginThrottle requestThrottle;
    private final Mailer mailer;
    private final Clock clock;
    private final SecureRandom random;
    private final Duration ttl;
    private final String resetUrlBase;

    public PasswordResetService(
            UserStore users,
            PasswordResetStore store,
            PasswordHasher hasher,
            RefreshTokenService refreshTokens,
            LoginThrottle loginThrottle,
            LoginThrottle requestThrottle,
            Mailer mailer,
            Clock clock,
            SecureRandom random,
            Duration ttl,
            String resetUrlBase) {
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("The reset-token lifetime must be positive");
        }
        if (resetUrlBase == null || !resetUrlBase.startsWith("http")) {
            throw new IllegalArgumentException("The reset URL must be an absolute http(s) URL");
        }
        this.users = users;
        this.store = store;
        this.hasher = hasher;
        this.refreshTokens = refreshTokens;
        this.loginThrottle = loginThrottle;
        this.requestThrottle = requestThrottle;
        this.mailer = mailer;
        this.clock = clock;
        this.random = random;
        this.ttl = ttl;
        this.resetUrlBase = resetUrlBase;
    }

    /**
     * Sends a reset link when the email belongs to an active account; does nothing otherwise. The caller always
     * answers the same way. Requests are rate limited per email, for known and unknown emails alike.
     *
     * @throws AuthException TOO_MANY_ATTEMPTS when this email asked too often
     */
    public void requestReset(String email) {
        String normalized = InputRules.normalizeEmail(email);
        if (normalized == null) {
            return;
        }
        requestThrottle.checkAllowed(normalized);
        requestThrottle.recordFailure(normalized); // counts every request, not only failures
        UserStore.Account account = users.findByEmail(normalized).orElse(null);
        if (account == null || !account.active()) {
            return;
        }
        Instant now = clock.instant();
        store.invalidateOutstanding(account.id(), now);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expires = now.plus(ttl);
        store.save(new PasswordResetStore.Record(UUID.randomUUID(), account.id(), hash(raw), now, expires, null));
        String separator = resetUrlBase.contains("?") ? "&" : "?";
        mailer.sendPasswordReset(account.email(), account.fullName(), resetUrlBase + separator + "token=" + raw, expires);
    }

    /**
     * @throws AuthException INVALID_INPUT for a weak password, RESET_TOKEN_INVALID for an unknown, used or expired link
     */
    public void resetPassword(String rawToken, String newPassword) {
        PasswordResetStore.Record record = lookup(rawToken);
        UserStore.Account account = users.findById(record.userId()).orElse(null);
        if (account == null || !account.active()) {
            throw invalid();
        }
        String problem = newPassword == null ? "Enter a new password." : InputRules.passwordError(newPassword, account.email());
        if (problem != null) {
            // Checked before the token is consumed so the person can correct the password and use the same link.
            throw new AuthException(AuthException.Code.INVALID_INPUT, "Please fix the highlighted fields.", Map.of("password", problem));
        }
        Instant now = clock.instant();
        if (!store.markUsed(record.id(), now)) {
            throw invalid();
        }
        users.updatePasswordHash(account.id(), hasher.hash(newPassword));
        store.invalidateOutstanding(account.id(), now);
        refreshTokens.revokeAll(account.id());
        loginThrottle.recordSuccess(account.email());
    }

    private PasswordResetStore.Record lookup(String rawToken) {
        if (rawToken == null || !RAW_SHAPE.matcher(rawToken).matches()) {
            throw invalid();
        }
        PasswordResetStore.Record record = store.findByHash(hash(rawToken)).orElseThrow(PasswordResetService::invalid);
        if (record.usedAt() != null || !clock.instant().isBefore(record.expiresAt())) {
            throw invalid();
        }
        return record;
    }

    private static AuthException invalid() {
        return new AuthException(AuthException.Code.RESET_TOKEN_INVALID, "This reset link is invalid or has expired. Request a new one.");
    }

    private static String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
