package dev.algovision.identity.core;

import java.util.Map;

/** An expected authentication failure. Framework-free: the web layer maps {@link Code} to HTTP. */
public class AuthException extends RuntimeException {

    public enum Code {
        INVALID_INPUT,
        EMAIL_TAKEN,
        INVALID_CREDENTIALS,
        ACCOUNT_DISABLED,
        TOO_MANY_ATTEMPTS,
        TOKEN_INVALID,
        TOKEN_REUSED,
        RESET_TOKEN_INVALID
    }

    private static final long serialVersionUID = 1L;

    private final Code code;
    private final transient Map<String, String> fieldErrors;

    public AuthException(Code code, String message) {
        this(code, message, Map.of());
    }

    public AuthException(Code code, String message, Map<String, String> fieldErrors) {
        super(message);
        this.code = code;
        this.fieldErrors = Map.copyOf(fieldErrors);
    }

    public Code code() {
        return code;
    }

    /** Field name to message, only for {@link Code#INVALID_INPUT}. */
    public Map<String, String> fieldErrors() {
        return fieldErrors;
    }
}
