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
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Rotating refresh tokens with reuse detection. Every refresh consumes the presented token and issues a new one in
 * the same family. Presenting a token that was already consumed means it leaked (or was replayed), so the whole family
 * is revoked and the user must sign in again.
 */
public final class RefreshTokenService {

    private static final Pattern RAW_SHAPE = Pattern.compile("^[A-Za-z0-9_-]{43}$");

    private final RefreshTokenStore store;
    private final Clock clock;
    private final Duration ttl;
    private final SecureRandom random;
    private final Duration grace;

    /** Strict rotation: any second use of a token is treated as theft. */
    public RefreshTokenService(RefreshTokenStore store, Clock clock, Duration ttl, SecureRandom random) {
        this(store, clock, ttl, random, Duration.ZERO);
    }

    /**
     * @param grace how long after a rotation the old token may still be presented without being treated as theft.
     *     A browser that reloads while a refresh is in flight loses the new cookie but the server has already rotated,
     *     and two tabs can refresh at the same instant; without a short window both sign the user out. Within the
     *     window the old token simply yields another token in the same family. Zero disables it.
     */
    public RefreshTokenService(RefreshTokenStore store, Clock clock, Duration ttl, SecureRandom random, Duration grace) {
        if (grace == null || grace.isNegative() || grace.compareTo(Duration.ofMinutes(1)) > 0) {
            throw new IllegalArgumentException("The refresh grace window must be between 0 and 1 minute");
        }
        this.grace = grace;
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("The refresh-token lifetime must be positive");
        }
        this.store = store;
        this.clock = clock;
        this.ttl = ttl;
        this.random = random;
    }

    /** The raw token is returned once and never stored. */
    public record Issued(String rawToken, Instant expiresAt, UUID familyId) {}

    public record Rotation(UUID userId, Issued next) {}

    /** Starts a new family, for a fresh login or registration. */
    public Issued start(UUID userId, String userAgent) {
        return issue(userId, UUID.randomUUID(), userAgent);
    }

    public Rotation rotate(String rawToken, String userAgent) {
        RefreshTokenStore.Record record = lookup(rawToken);
        Instant now = clock.instant();
        if (record.revokedAt() != null) {
            throw invalid();
        }
        if (record.rotatedAt() != null) {
            return withinGrace(record.rotatedAt(), now) ? sibling(record, userAgent) : reuse(record, now);
        }
        if (!now.isBefore(record.expiresAt())) {
            throw invalid();
        }
        if (!store.markRotated(record.id(), now)) {
            // Someone else consumed it between our read and write: a replay, unless it happened a moment ago.
            return grace.isZero() ? reuse(record, now) : sibling(record, userAgent);
        }
        return new Rotation(record.userId(), issue(record.userId(), record.familyId(), userAgent));
    }

    /** Logout: ends the whole family the token belongs to. Unknown or malformed tokens are ignored (idempotent). */
    public void revoke(String rawToken) {
        if (rawToken == null || !RAW_SHAPE.matcher(rawToken).matches()) {
            return;
        }
        store.findByHash(hash(rawToken)).ifPresent(r -> store.revokeFamily(r.familyId(), clock.instant()));
    }

    public void revokeAll(UUID userId) {
        store.revokeAllForUser(userId, clock.instant());
    }

    private boolean withinGrace(Instant rotatedAt, Instant now) {
        return !grace.isZero() && now.isBefore(rotatedAt.plus(grace));
    }

    /** Another token in the same family for a token that was rotated a moment ago. The family stays intact. */
    private Rotation sibling(RefreshTokenStore.Record record, String userAgent) {
        if (!clock.instant().isBefore(record.expiresAt())) {
            throw invalid();
        }
        return new Rotation(record.userId(), issue(record.userId(), record.familyId(), userAgent));
    }

    private Rotation reuse(RefreshTokenStore.Record record, Instant now) {
        store.revokeFamily(record.familyId(), now);
        throw new AuthException(AuthException.Code.TOKEN_REUSED, "Your session ended for security reasons. Please sign in again.");
    }

    private RefreshTokenStore.Record lookup(String rawToken) {
        if (rawToken == null || !RAW_SHAPE.matcher(rawToken).matches()) {
            throw invalid();
        }
        return store.findByHash(hash(rawToken)).orElseThrow(RefreshTokenService::invalid);
    }

    private Issued issue(UUID userId, UUID familyId, String userAgent) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = clock.instant();
        Instant expiresAt = now.plus(ttl);
        String agent = userAgent == null ? null : userAgent.substring(0, Math.min(userAgent.length(), 300));
        store.save(new RefreshTokenStore.Record(UUID.randomUUID(), userId, familyId, hash(raw), now, expiresAt, null, null, agent));
        return new Issued(raw, expiresAt, familyId);
    }

    /** Lower-case hex SHA-256, matching the {@code char(64)} column and its check constraint. */
    static String hash(String raw) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }

    private static AuthException invalid() {
        return new AuthException(AuthException.Code.TOKEN_INVALID, "The session is not valid. Please sign in again.");
    }
}
