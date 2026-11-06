package dev.algovision.platform.web;

import dev.algovision.platform.config.AppProperties;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Set;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * CSRF defence for the cookie-based refresh flow, layered on top of SameSite=Strict:
 * <ol>
 *   <li>Every state-changing request under /api/ must carry an Origin (or, failing that, a Referer)
 *       whose origin exactly equals one of app.allowed-origins. No Origin and no Referer is rejected.</li>
 *   <li>It must also carry the custom client header. A cross-site page cannot add a custom header
 *       without a CORS preflight, and CORS is not enabled, so such a request never succeeds.</li>
 * </ol>
 * Safe methods (GET, HEAD, OPTIONS, TRACE) are not checked; they must never change state.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class OriginCheckFilter extends OncePerRequestFilter {

    private static final Set<String> SAFE_METHODS = Set.of("GET", "HEAD", "OPTIONS", "TRACE");

    private final boolean enabled;
    private final Set<String> allowedOrigins;
    private final String clientHeader;
    private final String clientHeaderValue;

    public OriginCheckFilter(AppProperties properties) {
        this.enabled = properties.originCheck().enabled();
        this.allowedOrigins = properties.allowedOriginSet();
        this.clientHeader = properties.originCheck().clientHeader();
        this.clientHeaderValue = properties.originCheck().clientHeaderValue();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if (!enabled || SAFE_METHODS.contains(request.getMethod().toUpperCase())) {
            return true;
        }
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String requestId = RequestIdFilter.idOf(request);

        String origin = request.getHeader("Origin");
        String effective;
        if (origin != null) {
            effective = origin; // "null" and anything malformed simply fail the exact-match below
        } else {
            String referer = request.getHeader("Referer");
            effective = referer == null ? null : AppProperties.originOf(referer);
        }
        if (effective == null || !allowedOrigins.contains(effective)) {
            logger.warn("Rejected state-changing request: origin not allowed");
            ProblemJson.write(response, 403, "Forbidden", "ORIGIN_NOT_ALLOWED",
                    "This request did not come from an allowed origin.", requestId);
            return;
        }

        if (!clientHeaderValue.equals(request.getHeader(clientHeader))) {
            logger.warn("Rejected state-changing request: client header missing");
            ProblemJson.write(response, 403, "Forbidden", "CLIENT_HEADER_MISSING",
                    "This request is missing a required header.", requestId);
            return;
        }
        chain.doFilter(request, response);
    }
}
