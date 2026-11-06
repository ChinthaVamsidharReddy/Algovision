package dev.algovision.identity.core;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/** Persistence for refresh tokens. Only SHA-256 hashes are stored, never the token itself. */
public interface RefreshTokenStore {

    record Record(
            UUID id,
            UUID userId,
            UUID familyId,
            String tokenHash,
            Instant issuedAt,
            Instant expiresAt,
            Instant rotatedAt,
            Instant revokedAt,
            String userAgent) {}

    void save(Record record);

    Optional<Record> findByHash(String tokenHash);

    /**
     * Atomically marks the token as used. Returns true for exactly one caller even when several race:
     * implementations must update only where rotated_at and revoked_at are still null.
     */
    boolean markRotated(UUID id, Instant at);

    /** Revokes every still-active token of the family; returns how many changed. */
    int revokeFamily(UUID familyId, Instant at);

    int revokeAllForUser(UUID userId, Instant at);
}
