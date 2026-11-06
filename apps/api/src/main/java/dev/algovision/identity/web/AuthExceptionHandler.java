package dev.algovision.identity.web;

import dev.algovision.identity.AuthProperties;
import dev.algovision.identity.core.AuthException;
import java.util.List;
import java.util.Map;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/** Maps the framework-free {@link AuthException} to the API's Problem Details shape. */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthExceptionHandler {

    private final AuthProperties.Cookie cookie;

    public AuthExceptionHandler(AuthProperties properties) {
        this.cookie = properties.refreshCookie();
    }

    @ExceptionHandler(AuthException.class)
    public ResponseEntity<ProblemDetail> handle(AuthException ex) {
        HttpStatus status = switch (ex.code()) {
            case INVALID_INPUT, RESET_TOKEN_INVALID -> HttpStatus.BAD_REQUEST;
            case EMAIL_TAKEN -> HttpStatus.CONFLICT;
            case INVALID_CREDENTIALS, TOKEN_INVALID, TOKEN_REUSED -> HttpStatus.UNAUTHORIZED;
            case ACCOUNT_DISABLED -> HttpStatus.FORBIDDEN;
            case TOO_MANY_ATTEMPTS -> HttpStatus.TOO_MANY_REQUESTS;
        };
        ProblemDetail body = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
        body.setTitle(status.getReasonPhrase());
        body.setProperty("code", ex.code().name());
        if (!ex.fieldErrors().isEmpty()) {
            List<Map<String, String>> errors = ex.fieldErrors().entrySet().stream()
                    .sorted(Map.Entry.comparingByKey())
                    .map(e -> Map.of("field", e.getKey(), "message", e.getValue()))
                    .toList();
            body.setProperty("errors", errors);
        }
        ResponseEntity.BodyBuilder response = ResponseEntity.status(status).cacheControl(CacheControl.noStore());
        if (ex.code() == AuthException.Code.TOKEN_INVALID || ex.code() == AuthException.Code.TOKEN_REUSED) {
            // A rejected refresh token is useless; drop the cookie so the browser stops sending it.
            ResponseCookie cleared = ResponseCookie.from(cookie.name(), "")
                    .httpOnly(true).secure(cookie.secure()).sameSite(cookie.sameSite()).path(cookie.path()).maxAge(0).build();
            response.header(HttpHeaders.SET_COOKIE, cleared.toString());
        }
        return response.body(body);
    }
}
