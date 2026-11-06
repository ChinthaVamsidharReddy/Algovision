package dev.algovision.identity.core;

import java.time.Instant;

/** Outbound email. The console implementation (dev) only logs; a real provider is a later decision. */
public interface Mailer {

    /** @param resetUrl the full link containing the single-use token; never log it outside development */
    void sendPasswordReset(String toEmail, String fullName, String resetUrl, Instant expiresAt);
}
