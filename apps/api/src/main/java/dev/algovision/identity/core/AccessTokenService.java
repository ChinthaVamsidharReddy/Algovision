package dev.algovision.identity.core;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.regex.Pattern;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * Short-lived signed access token: {@code av1.<payload>.<signature>}, where the payload is
 * {@code userId;expiresAtEpochSeconds;ROLE_A,ROLE_B} (base64url) and the signature is HMAC-SHA256 over
 * {@code av1.<payload>}. It is deliberately not a JWT: only this API reads it, the format is fixed, so there is no
 * algorithm negotiation to attack and nothing for a third party to parse.
 */
public final class AccessTokenService {

    private static final String VERSION = "av1";
    private static final Pattern ROLE = Pattern.compile("^ROLE_[A-Z_]+$");
    private static final int MAX_TOKEN_LENGTH = 1024;

    private final byte[] key;
    private final Duration ttl;
    private final Clock clock;

    public AccessTokenService(byte[] key, Duration ttl, Clock clock) {
        if (key == null || key.length < 32) {
            throw new IllegalArgumentException("The access-token key must be at least 32 bytes");
        }
        if (ttl == null || ttl.isZero() || ttl.isNegative()) {
            throw new IllegalArgumentException("The access-token lifetime must be positive");
        }
        this.key = key.clone();
        this.ttl = ttl;
        this.clock = clock;
    }

    public record Claims(UUID userId, Set<String> roles, Instant expiresAt) {}

    public record Issued(String token, Instant expiresAt) {}

    public Issued issue(UUID userId, Set<String> roles) {
        for (String role : roles) {
            if (!ROLE.matcher(role).matches()) {
                throw new IllegalArgumentException("Invalid role name: " + role);
            }
        }
        Instant expiresAt = clock.instant().plus(ttl);
        String payload = userId + ";" + expiresAt.getEpochSecond() + ";" + String.join(",", new TreeSet<>(roles));
        String body = VERSION + "." + Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return new Issued(body + "." + sign(body), expiresAt);
    }

    /** @throws AuthException TOKEN_INVALID for anything that is not a valid, unexpired token signed with our key. */
    public Claims verify(String token) {
        if (token == null || token.length() > MAX_TOKEN_LENGTH) {
            throw invalid();
        }
        String[] parts = token.split("\\.", -1);
        if (parts.length != 3 || !parts[0].equals(VERSION)) {
            throw invalid();
        }
        String body = parts[0] + "." + parts[1];
        byte[] expected = sign(body).getBytes(StandardCharsets.US_ASCII);
        byte[] actual = parts[2].getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw invalid();
        }
        try {
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
            String[] fields = payload.split(";", -1);
            if (fields.length != 3) {
                throw invalid();
            }
            UUID userId = UUID.fromString(fields[0]);
            Instant expiresAt = Instant.ofEpochSecond(Long.parseLong(fields[1]));
            if (!clock.instant().isBefore(expiresAt)) {
                throw invalid();
            }
            Set<String> roles = new LinkedHashSet<>();
            if (!fields[2].isEmpty()) {
                for (String role : fields[2].split(",", -1)) {
                    if (!ROLE.matcher(role).matches()) {
                        throw invalid();
                    }
                    roles.add(role);
                }
            }
            return new Claims(userId, Set.copyOf(roles), expiresAt);
        } catch (IllegalArgumentException | java.time.DateTimeException e) {
            throw invalid();
        }
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 is not available", e);
        }
    }

    private static AuthException invalid() {
        return new AuthException(AuthException.Code.TOKEN_INVALID, "The session is not valid. Please sign in again.");
    }
}
