package dev.algovision.identity.web;

import dev.algovision.identity.core.AuthException;

/** Extracts the access token from an {@code Authorization: Bearer} header. */
public final class BearerToken {

    private BearerToken() {}

    public static String extract(String header) {
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            throw new AuthException(AuthException.Code.TOKEN_INVALID, "Sign in to continue.");
        }
        return header.substring(7).strip();
    }
}
