package dev.algovision.identity.core;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class InputRulesTest {

    @Test
    void normalizesEmails() {
        assertEquals("a.b@example.com", InputRules.normalizeEmail("  A.B@Example.COM "));
        assertEquals("x+tag@mail.example.co.in", InputRules.normalizeEmail("x+tag@mail.example.co.in"));
    }

    @Test
    void rejectsBadEmails() {
        String[] bad = {null, "", "plain", "a@b", "a@@b.com", "a b@c.com", "@c.com", "a@.com", "a@c..com", "a@-c.com", "a@c.com\nb@d.com", "a@c.com, d@e.com", "a".repeat(65) + "@c.com", "a@" + "b".repeat(250) + ".com"};
        for (String email : bad) {
            assertNull(InputRules.normalizeEmail(email), String.valueOf(email));
        }
    }

    @Test
    void passwordRulesCoverLengthCommonAndEmailName() {
        assertNotNull(InputRules.passwordError("short", null));
        assertNotNull(InputRules.passwordError("a".repeat(129), null));
        assertNotNull(InputRules.passwordError("Password123", null));
        assertNotNull(InputRules.passwordError("aaaaaaaaaaaa", null));
        assertNotNull(InputRules.passwordError("my-vamsidhar-pass", "vamsidhar@example.com"));
        assertNull(InputRules.passwordError("abcd".repeat(32), null), "exactly 128 characters is allowed");
        assertNull(InputRules.passwordError("tr1cky-Passphrase!", "vamsidhar@example.com"));
        assertNull(InputRules.passwordError("long enough phrase", "a@b.co"), "short email names are not checked");
    }

    @Test
    void registrationCollectsEveryFieldError() {
        var errors = InputRules.validateRegistration("nope", "x", "  ");
        assertEquals(3, errors.size());
        assertTrue(errors.containsKey("email") && errors.containsKey("password") && errors.containsKey("fullName"));
        assertTrue(InputRules.validateRegistration("a@b.co", "tr1cky-Passphrase!", "Ada").isEmpty());
        assertEquals(1, InputRules.validateRegistration("a@b.co", "tr1cky-Passphrase!", "n".repeat(121)).size());
    }
}
