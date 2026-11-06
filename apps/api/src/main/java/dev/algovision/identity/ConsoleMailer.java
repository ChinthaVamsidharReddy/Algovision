package dev.algovision.identity;

import dev.algovision.identity.core.Mailer;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Development mailer: writes the reset link to the application log instead of sending email. It is the only mailer
 * until an email provider is chosen, so password reset works locally but does not deliver mail in production. A reset
 * link in a log is a credential: do not run this in production with shared logs.
 */
@Component
@ConditionalOnProperty(name = "auth.mailer", havingValue = "console", matchIfMissing = true)
public class ConsoleMailer implements Mailer {

    private static final Logger LOG = LoggerFactory.getLogger(ConsoleMailer.class);

    @Override
    public void sendPasswordReset(String toEmail, String fullName, String resetUrl, Instant expiresAt) {
        LOG.warn("[console mailer - development only] Password reset for {} <{}>, valid until {}: {}", fullName, toEmail, expiresAt, resetUrl);
    }
}
