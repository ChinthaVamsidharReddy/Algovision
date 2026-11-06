package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Duration;
import java.util.Base64;
import java.util.Random;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class AccessTokenServiceTest {

    private static final byte[] KEY = "0123456789abcdef0123456789abcdef".getBytes(java.nio.charset.StandardCharsets.UTF_8);
    private final Support.MutableClock clock = new Support.MutableClock();
    private final AccessTokenService tokens = new AccessTokenService(KEY, Duration.ofMinutes(15), clock);

    private void assertInvalid(String token) {
        AuthException e = assertThrows(AuthException.class, () -> tokens.verify(token), String.valueOf(token));
        assertEquals(AuthException.Code.TOKEN_INVALID, e.code());
    }

    @Test
    void roundTripsUserAndRoles() {
        UUID id = UUID.randomUUID();
        var issued = tokens.issue(id, Set.of("ROLE_STUDENT", "ROLE_ADMIN"));
        var claims = tokens.verify(issued.token());
        assertEquals(id, claims.userId());
        assertEquals(Set.of("ROLE_STUDENT", "ROLE_ADMIN"), claims.roles());
        assertEquals(issued.expiresAt(), claims.expiresAt());
    }

    @Test
    void expiresExactlyAtTheLifetime() {
        String token = tokens.issue(UUID.randomUUID(), Set.of("ROLE_STUDENT")).token();
        clock.advance(Duration.ofMinutes(15).minusSeconds(1));
        tokens.verify(token);
        clock.advance(Duration.ofSeconds(1));
        assertInvalid(token);
    }

    @Test
    void rejectsTamperingAtEveryPart() {
        String token = tokens.issue(UUID.randomUUID(), Set.of("ROLE_STUDENT")).token();
        String[] parts = token.split("\\.");
        // swap in a payload that grants the admin role, keeping the old signature
        String forged = new String(Base64.getUrlDecoder().decode(parts[1])).replace("ROLE_STUDENT", "ROLE_ADMIN");
        String forgedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(forged.getBytes());
        assertInvalid(parts[0] + "." + forgedPayload + "." + parts[2]);
        assertInvalid("av2." + parts[1] + "." + parts[2]);
        assertInvalid(parts[0] + "." + parts[1] + "." + parts[2].substring(1) + "A");
        assertInvalid(parts[0] + "." + parts[1] + ".");
        assertInvalid(parts[0] + "." + parts[1]);
    }

    @Test
    void rejectsATokenSignedWithAnotherKey() {
        byte[] other = "ffffffffffffffffffffffffffffffff".getBytes();
        String foreign = new AccessTokenService(other, Duration.ofMinutes(15), clock).issue(UUID.randomUUID(), Set.of("ROLE_STUDENT")).token();
        assertInvalid(foreign);
    }

    @Test
    void neverThrowsAnythingButAuthExceptionOnGarbage() {
        Random random = new Random(7);
        String alphabet = "abcXYZ019._-=;,:ROLE_ ";
        for (int i = 0; i < 5000; i++) {
            StringBuilder sb = new StringBuilder(random.nextBoolean() ? "av1." : "");
            for (int n = random.nextInt(80); n > 0; n--) {
                sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
            }
            assertInvalid(sb.toString());
        }
        assertInvalid(null);
        assertInvalid("");
        assertInvalid("a".repeat(5000));
    }

    @Test
    void validatesConstructionAndRoleNames() {
        assertThrows(IllegalArgumentException.class, () -> new AccessTokenService(new byte[10], Duration.ofMinutes(1), clock));
        assertThrows(IllegalArgumentException.class, () -> new AccessTokenService(KEY, Duration.ZERO, clock));
        assertThrows(IllegalArgumentException.class, () -> tokens.issue(UUID.randomUUID(), Set.of("admin,ROLE_ADMIN")));
        assertTrue(tokens.verify(tokens.issue(UUID.randomUUID(), Set.of()).token()).roles().isEmpty());
        assertFalse(tokens.issue(UUID.randomUUID(), Set.of()).token().contains("="));
    }
}
