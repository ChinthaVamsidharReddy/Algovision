package dev.algovision.identity.core;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Persistence for password-reset tokens. Only SHA-256 hashes are stored. */
public interface PasswordResetStore {

    record Record(UUID id, UUID userId, String tokenHash, Instant createdAt, Instant expiresAt, Instant usedAt) {}

    void save(Record record);

    Optional<Record> findByHash(String tokenHash);

    /** Atomically consumes the token; true for exactly one caller, and only while unused and unexpired. */
    boolean markUsed(UUID id, Instant at);

    /** Consumes every still-unused token of the user, so only the newest link works. */
    int invalidateOutstanding(UUID userId, Instant at);
}
