package dev.algovision.identity.core;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** In-memory fakes with the same contracts as the JDBC stores, so the core logic is tested without a database. */
final class Support {

    private Support() {}

    static final class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-01-01T00:00:00Z");

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public synchronized Instant instant() {
            return now;
        }

        synchronized void advance(Duration d) {
            now = now.plus(d);
        }
    }

    static class MemoryRefreshStore implements RefreshTokenStore {
        final Map<UUID, Record> byId = new HashMap<>();

        @Override
        public synchronized void save(Record r) {
            if (byId.values().stream().anyMatch(x -> x.tokenHash().equals(r.tokenHash()))) {
                throw new IllegalStateException("duplicate token hash");
            }
            byId.put(r.id(), r);
        }

        @Override
        public synchronized Optional<Record> findByHash(String hash) {
            return byId.values().stream().filter(r -> r.tokenHash().equals(hash)).findFirst();
        }

        @Override
        public synchronized boolean markRotated(UUID id, Instant at) {
            Record r = byId.get(id);
            if (r == null || r.rotatedAt() != null || r.revokedAt() != null) {
                return false;
            }
            byId.put(id, new Record(r.id(), r.userId(), r.familyId(), r.tokenHash(), r.issuedAt(), r.expiresAt(), at, r.revokedAt(), r.userAgent()));
            return true;
        }

        @Override
        public synchronized int revokeFamily(UUID familyId, Instant at) {
            return revoke(r -> r.familyId().equals(familyId), at);
        }

        @Override
        public synchronized int revokeAllForUser(UUID userId, Instant at) {
            return revoke(r -> r.userId().equals(userId), at);
        }

        private int revoke(java.util.function.Predicate<Record> match, Instant at) {
            int changed = 0;
            for (Record r : new ArrayList<>(byId.values())) {
                if (match.test(r) && r.revokedAt() == null) {
                    byId.put(r.id(), new Record(r.id(), r.userId(), r.familyId(), r.tokenHash(), r.issuedAt(), r.expiresAt(), r.rotatedAt(), at, r.userAgent()));
                    changed++;
                }
            }
            return changed;
        }

        synchronized List<Record> all() {
            return new ArrayList<>(byId.values());
        }
    }

    static final class MemoryUserStore implements UserStore {
        final Map<UUID, Account> byId = new HashMap<>();
        int logins;
        int rehashes;

        @Override
        public synchronized Optional<Account> findByEmail(String email) {
            return byId.values().stream().filter(a -> a.email().equals(email)).findFirst();
        }

        @Override
        public synchronized Optional<Account> findById(UUID id) {
            return Optional.ofNullable(byId.get(id));
        }

        @Override
        public synchronized Account create(String email, String hash, String name) {
            if (findByEmail(email).isPresent()) {
                throw new AuthException(AuthException.Code.EMAIL_TAKEN, "An account with this email already exists.");
            }
            Account a = new Account(UUID.randomUUID(), email, hash, name, true, Set.of("ROLE_STUDENT"));
            byId.put(a.id(), a);
            return a;
        }

        @Override
        public synchronized void recordLogin(UUID id, Instant at) {
            logins++;
        }

        @Override
        public synchronized void updatePasswordHash(UUID id, String hash) {
            Account a = byId.get(id);
            byId.put(id, new Account(a.id(), a.email(), hash, a.fullName(), a.active(), a.roles()));
            rehashes++;
        }

        synchronized void disable(UUID id) {
            Account a = byId.get(id);
            byId.put(id, new Account(a.id(), a.email(), a.passwordHash(), a.fullName(), false, a.roles()));
        }
    }
}
