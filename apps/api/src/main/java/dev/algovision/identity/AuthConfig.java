package dev.algovision.identity;

import dev.algovision.identity.core.AccessTokenService;
import dev.algovision.identity.core.AuthService;
import dev.algovision.identity.core.LoginThrottle;
import dev.algovision.identity.core.Mailer;
import dev.algovision.identity.core.PasswordResetService;
import dev.algovision.identity.core.PasswordResetStore;
import dev.algovision.identity.core.PasswordHasher;
import dev.algovision.identity.core.Pbkdf2PasswordHasher;
import dev.algovision.identity.core.RefreshTokenService;
import dev.algovision.identity.core.RefreshTokenStore;
import dev.algovision.identity.core.UserStore;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Wires the framework-free identity core to Spring. All logic lives in {@code identity.core}. */
@Configuration
public class AuthConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    SecureRandom secureRandom() {
        return new SecureRandom();
    }

    @Bean
    PasswordHasher passwordHasher(AuthProperties p, SecureRandom random) {
        return new Pbkdf2PasswordHasher(p.passwordIterations(), random);
    }

    @Bean
    AccessTokenService accessTokenService(AuthProperties p, Clock clock) {
        return new AccessTokenService(p.tokenSecret().getBytes(StandardCharsets.UTF_8), p.accessTtl(), clock);
    }

    @Bean
    RefreshTokenService refreshTokenService(RefreshTokenStore store, AuthProperties p, Clock clock, SecureRandom random) {
        return new RefreshTokenService(store, clock, p.refreshTtl(), random, p.refreshGrace());
    }

    @Bean
    LoginThrottle loginThrottle(AuthProperties p, Clock clock) {
        return new LoginThrottle(clock, p.loginMaxFailures(), p.loginWindow());
    }

    @Bean
    AuthService authService(
            UserStore users, PasswordHasher hasher, AccessTokenService access, RefreshTokenService refresh, LoginThrottle throttle, Clock clock) {
        return new AuthService(users, hasher, access, refresh, throttle, clock);
    }

    @Bean
    PasswordResetService passwordResetService(
            UserStore users,
            PasswordResetStore store,
            PasswordHasher hasher,
            RefreshTokenService refresh,
            LoginThrottle loginThrottle,
            Mailer mailer,
            AuthProperties p,
            Clock clock,
            SecureRandom random) {
        LoginThrottle requestThrottle = new LoginThrottle(clock, p.reset().maxRequests(), p.reset().window());
        return new PasswordResetService(users, store, hasher, refresh, loginThrottle, requestThrottle, mailer, clock, random, p.reset().ttl(), p.reset().url());
    }
}
