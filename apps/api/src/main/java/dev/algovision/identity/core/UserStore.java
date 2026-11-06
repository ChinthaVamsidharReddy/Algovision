package dev.algovision.identity.core;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/** Persistence for accounts and their roles. Emails are always passed in normalized (trimmed, lower-case) form. */
public interface UserStore {

    record Account(UUID id, String email, String passwordHash, String fullName, boolean active, Set<String> roles) {}

    Optional<Account> findByEmail(String normalizedEmail);

    Optional<Account> findById(UUID id);

    /**
     * Creates the account with the student role.
     *
     * @throws AuthException EMAIL_TAKEN when the email already exists (including a concurrent registration)
     */
    Account create(String normalizedEmail, String passwordHash, String fullName);

    void recordLogin(UUID id, Instant at);

    void updatePasswordHash(UUID id, String passwordHash);
}
