package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PasswordHasherTest {

    private final Pbkdf2PasswordHasher hasher = new Pbkdf2PasswordHasher(2_000);

    @Test
    void verifiesTheRightPasswordOnly() {
        String stored = hasher.hash("correct horse battery");
        assertTrue(hasher.verify("correct horse battery", stored));
        assertFalse(hasher.verify("correct horse batterY", stored));
        assertFalse(hasher.verify("", stored));
    }

    @Test
    void usesAFreshSaltEachTimeAndNeverStoresThePassword() {
        String a = hasher.hash("same password 1");
        String b = hasher.hash("same password 1");
        assertNotEquals(a, b);
        assertFalse(a.contains("same password"));
        assertTrue(a.startsWith("pbkdf2-sha256$2000$"));
    }

    @Test
    void handlesUnicodeAndLongInput() {
        String unicode = "pässwörd-密码-🔐-ok";
        assertTrue(hasher.verify(unicode, hasher.hash(unicode)));
        String longPassword = "x".repeat(128);
        assertTrue(hasher.verify(longPassword, hasher.hash(longPassword)));
    }

    @Test
    void malformedStoredValuesNeverVerifyAndNeverThrow() {
        String good = hasher.hash("abc123456789");
        String[] bad = {
            null, "", "plain", "pbkdf2-sha256$2000$a$b", "pbkdf2-sha256$x$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAA==",
            "pbkdf2-sha256$999999999$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAA==", "bcrypt$2000$AAAA$AAAA", good + "$extra",
            good.replace("$2000$", "$10$"), "pbkdf2-sha256$2000$!!!$!!!"
        };
        for (String stored : bad) {
            assertFalse(hasher.verify("abc123456789", stored), String.valueOf(stored));
        }
    }

    @Test
    void asksForRehashWhenParametersAreWeakerOrUnknown() {
        String weak = new Pbkdf2PasswordHasher(1_000).hash("abc123456789");
        assertTrue(hasher.needsRehash(weak));
        assertFalse(hasher.needsRehash(hasher.hash("abc123456789")));
        assertTrue(hasher.needsRehash("garbage"));
    }

    @Test
    void rejectsWeakIterationSettings() {
        assertThrows(IllegalArgumentException.class, () -> new Pbkdf2PasswordHasher(10));
        assertEquals(600_000, Pbkdf2PasswordHasher.DEFAULT_ITERATIONS);
    }
}
