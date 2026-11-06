package dev.algovision.identity.core;

/** Slow, salted password hashing behind an interface so the algorithm can be replaced without touching callers. */
public interface PasswordHasher {

    String hash(CharSequence rawPassword);

    /** Constant-time comparison; false for any malformed stored value. */
    boolean verify(CharSequence rawPassword, String stored);

    /** True when the stored hash uses weaker parameters than the current ones and should be recomputed at next login. */
    boolean needsRehash(String stored);
}
