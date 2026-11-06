package dev.algovision.identity.core;

import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/** Validation of registration and login input. Messages are user-facing; none reveals whether an account exists. */
public final class InputRules {

    public static final int PASSWORD_MIN = 10;
    public static final int PASSWORD_MAX = 128; // bounded so a huge password cannot be used to burn CPU in the hasher
    public static final int NAME_MAX = 120;

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]{1,64}@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$");
    private static final Set<String> COMMON = Set.of(
            "password", "password1", "password12", "password123", "passw0rd123", "1234567890", "12345678910",
            "qwertyuiop", "qwerty12345", "qwerty123456", "letmein1234", "iloveyou123", "welcome1234", "admin12345",
            "abc1234567", "111111111111", "0123456789", "changeme123");

    private InputRules() {}

    /** Trims and lower-cases; returns null if the value is not a plausible email address. */
    public static String normalizeEmail(String raw) {
        if (raw == null) {
            return null;
        }
        String email = raw.trim().toLowerCase(Locale.ROOT);
        if (email.length() > 254 || !EMAIL.matcher(email).matches()) {
            return null;
        }
        return email;
    }

    /** Field name to message; empty when everything is valid. */
    public static Map<String, String> validateRegistration(String email, String password, String fullName) {
        Map<String, String> errors = new HashMap<>();
        String normalized = normalizeEmail(email);
        if (normalized == null) {
            errors.put("email", "Enter a valid email address.");
        }
        if (fullName == null || fullName.isBlank()) {
            errors.put("fullName", "Enter your name.");
        } else if (fullName.strip().length() > NAME_MAX) {
            errors.put("fullName", "Your name can have at most " + NAME_MAX + " characters.");
        }
        String passwordError = passwordError(password, normalized);
        if (passwordError != null) {
            errors.put("password", passwordError);
        }
        return errors;
    }

    /** Null when the password is acceptable. {@code normalizedEmail} may be null. */
    public static String passwordError(String password, String normalizedEmail) {
        if (password == null || password.length() < PASSWORD_MIN) {
            return "Use at least " + PASSWORD_MIN + " characters.";
        }
        if (password.length() > PASSWORD_MAX) {
            return "Use at most " + PASSWORD_MAX + " characters.";
        }
        if (COMMON.contains(password.toLowerCase(Locale.ROOT))) {
            return "That password is too common. Choose something harder to guess.";
        }
        if (password.chars().distinct().count() < 4) {
            return "Use a password with more variety.";
        }
        if (normalizedEmail != null) {
            String local = normalizedEmail.substring(0, normalizedEmail.indexOf('@'));
            if (local.length() >= 4 && password.toLowerCase(Locale.ROOT).contains(local)) {
                return "Your password should not contain your email name.";
            }
        }
        return null;
    }
}
