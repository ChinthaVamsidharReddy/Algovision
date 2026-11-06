package dev.algovision.learning.core;

import java.io.Serial;

public final class LearningException extends RuntimeException {

    public enum Code { INVALID_INPUT, ALGORITHM_NOT_FOUND }

    @Serial
    private static final long serialVersionUID = 1L;

    private final Code code;

    public LearningException(Code code, String message) {
        super(message);
        this.code = code;
    }

    public Code code() {
        return code;
    }
}
