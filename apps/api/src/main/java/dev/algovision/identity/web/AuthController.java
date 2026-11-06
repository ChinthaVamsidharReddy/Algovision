package dev.algovision.identity.web;

import dev.algovision.identity.AuthProperties;
import dev.algovision.identity.core.AuthService;
import dev.algovision.identity.core.PasswordResetService;
import dev.algovision.identity.core.UserStore;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Authentication endpoints. The access token travels in the response body (kept in memory by the web app); the refresh
 * token only ever travels in an httpOnly cookie scoped to this path, so scripts cannot read it. State-changing calls
 * also pass the Origin check (OriginCheckFilter).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    public record RegisterRequest(String email, String password, String fullName) {}

    public record LoginRequest(String email, String password) {}

    public record ForgotPasswordRequest(String email) {}

    public record ResetPasswordRequest(String token, String password) {}

    public record Accepted(String message) {}

    public record UserView(UUID id, String email, String fullName, List<String> roles) {}

    public record SessionResponse(UserView user, String accessToken, Instant accessTokenExpiresAt) {}

    private final AuthService auth;
    private final PasswordResetService passwordReset;
    private final CookieFactory cookies;
    private final String cookieName;

    public AuthController(AuthService auth, PasswordResetService passwordReset, AuthProperties properties) {
        this.auth = auth;
        this.passwordReset = passwordReset;
        this.cookieName = properties.refreshCookie().name();
        this.cookies = new CookieFactory(properties);
    }

    @PostMapping("/register")
    public ResponseEntity<SessionResponse> register(
            @RequestBody RegisterRequest body, @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        return respond(HttpStatus.CREATED, auth.register(body.email(), body.password(), body.fullName(), userAgent));
    }

    @PostMapping("/login")
    public ResponseEntity<SessionResponse> login(
            @RequestBody LoginRequest body, @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        return respond(HttpStatus.OK, auth.login(body.email(), body.password(), userAgent));
    }

    @PostMapping("/refresh")
    public ResponseEntity<SessionResponse> refresh(
            HttpServletRequest request, @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        return respond(HttpStatus.OK, auth.refresh(refreshCookie(request), userAgent));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        auth.logout(refreshCookie(request));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.clear().toString())
                .cacheControl(CacheControl.noStore())
                .build();
    }

    /** Always 202 with the same text, whether or not the email has an account. */
    @PostMapping("/forgot-password")
    public ResponseEntity<Accepted> forgotPassword(@RequestBody ForgotPasswordRequest body) {
        passwordReset.requestReset(body.email());
        return ResponseEntity.accepted()
                .cacheControl(CacheControl.noStore())
                .body(new Accepted("If an account exists for that email, a reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@RequestBody ResetPasswordRequest body) {
        passwordReset.resetPassword(body.token(), body.password());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, cookies.clear().toString())
                .cacheControl(CacheControl.noStore())
                .build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserView> me(@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String authorization) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(view(auth.authenticate(BearerToken.extract(authorization))));
    }

    private String refreshCookie(HttpServletRequest request) {
        Cookie[] all = request.getCookies();
        if (all == null) {
            return null;
        }
        for (Cookie c : all) {
            if (c.getName().equals(cookieName)) {
                return c.getValue();
            }
        }
        return null;
    }

    private ResponseEntity<SessionResponse> respond(HttpStatus status, AuthService.Session session) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.SET_COOKIE, cookies.issue(session.refreshToken(), session.refreshExpiresAt()).toString())
                .cacheControl(CacheControl.noStore())
                .body(new SessionResponse(view(session.account()), session.accessToken(), session.accessExpiresAt()));
    }

    private static UserView view(UserStore.Account a) {
        return new UserView(a.id(), a.email(), a.fullName(), a.roles().stream().sorted().toList());
    }

    /** Builds the refresh cookie: httpOnly always, Secure unless explicitly disabled for plain-http local dev. */
    static final class CookieFactory {
        private final AuthProperties.Cookie settings;

        CookieFactory(AuthProperties properties) {
            this.settings = properties.refreshCookie();
        }

        ResponseCookie issue(String value, Instant expiresAt) {
            long maxAge = Math.max(0, expiresAt.getEpochSecond() - Instant.now().getEpochSecond());
            return base(value).maxAge(maxAge).build();
        }

        ResponseCookie clear() {
            return base("").maxAge(0).build();
        }

        private ResponseCookie.ResponseCookieBuilder base(String value) {
            return ResponseCookie.from(settings.name(), value)
                    .httpOnly(true)
                    .secure(settings.secure())
                    .sameSite(settings.sameSite())
                    .path(settings.path());
        }
    }
}
