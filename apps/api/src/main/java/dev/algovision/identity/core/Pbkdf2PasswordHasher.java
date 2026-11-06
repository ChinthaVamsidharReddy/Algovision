package dev.algovision.identity.core;

import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/**
 * PBKDF2-HMAC-SHA256 from the JDK (no third-party code). Stored form:
 * {@code pbkdf2-sha256$<iterations>$<salt base64>$<hash base64>}, so parameters can be raised later and old hashes
 * are upgraded at login via {@link #needsRehash}.
 */
public final class Pbkdf2PasswordHasher implements PasswordHasher {

    /** OWASP's 2023+ minimum for PBKDF2-HMAC-SHA256. */
    public static final int DEFAULT_ITERATIONS = 600_000;

    private static final String PREFIX = "pbkdf2-sha256";
    private static final int SALT_BYTES = 16;
    private static final int HASH_BITS = 256;
    private static final int MAX_ITERATIONS = 10_000_000; // refuse absurd values in a tampered row (DoS)

    private final int iterations;
    private final SecureRandom random;

    public Pbkdf2PasswordHasher(int iterations) {
        this(iterations, new SecureRandom());
    }

    public Pbkdf2PasswordHasher(int iterations, SecureRandom random) {
        if (iterations < 1_000) {
            throw new IllegalArgumentException("iterations must be at least 1000");
        }
        this.iterations = iterations;
        this.random = random;
    }

    @Override
    public String hash(CharSequence rawPassword) {
        byte[] salt = new byte[SALT_BYTES];
        random.nextBytes(salt);
        byte[] hash = derive(rawPassword, salt, iterations, HASH_BITS);
        Base64.Encoder b64 = Base64.getEncoder();
        return PREFIX + "$" + iterations + "$" + b64.encodeToString(salt) + "$" + b64.encodeToString(hash);
    }

    @Override
    public boolean verify(CharSequence rawPassword, String stored) {
        Parsed parsed = parse(stored);
        if (parsed == null) {
            return false;
        }
        byte[] actual = derive(rawPassword, parsed.salt, parsed.iterations, parsed.hash.length * 8);
        return MessageDigest.isEqual(actual, parsed.hash);
    }

    @Override
    public boolean needsRehash(String stored) {
        Parsed parsed = parse(stored);
        return parsed == null || parsed.iterations < iterations;
    }

    private record Parsed(int iterations, byte[] salt, byte[] hash) {}

    private static Parsed parse(String stored) {
        if (stored == null) {
            return null;
        }
        String[] parts = stored.split("\\$", -1);
        if (parts.length != 4 || !parts[0].equals(PREFIX)) {
            return null;
        }
        try {
            int iterations = Integer.parseInt(parts[1]);
            if (iterations < 1_000 || iterations > MAX_ITERATIONS) {
                return null;
            }
            byte[] salt = Base64.getDecoder().decode(parts[2]);
            byte[] hash = Base64.getDecoder().decode(parts[3]);
            if (salt.length < 8 || hash.length < 16) {
                return null;
            }
            return new Parsed(iterations, salt, hash);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static byte[] derive(CharSequence password, byte[] salt, int iterations, int bits) {
        char[] chars = new char[password.length()];
        for (int i = 0; i < chars.length; i++) {
            chars[i] = password.charAt(i);
        }
        PBEKeySpec spec = new PBEKeySpec(chars, salt, iterations, bits);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("PBKDF2WithHmacSHA256 is not available", e);
        } finally {
            spec.clearPassword();
            java.util.Arrays.fill(chars, '\0');
        }
    }
}
