package dev.algovision.platform.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.algovision.platform.config.AppProperties;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class OriginCheckFilterTest {

    private static final String WEB = "https://algovision.example";

    private static OriginCheckFilter filter(boolean enabled) {
        return new OriginCheckFilter(new AppProperties(
                List.of(WEB, "http://localhost:3000"),
                new AppProperties.OriginCheck(enabled, "X-AlgoVision-Client", "web"),
                null));
    }

    private static MockHttpServletRequest post(String path) {
        MockHttpServletRequest r = new MockHttpServletRequest("POST", path);
        r.setRequestURI(path);
        r.addHeader("X-AlgoVision-Client", "web");
        return r;
    }

    private record Result(int status, boolean passedThrough, String body) {}

    private static Result run(OriginCheckFilter f, MockHttpServletRequest request) throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        f.doFilter(request, response, chain);
        return new Result(response.getStatus(), chain.getRequest() != null, response.getContentAsString());
    }

    @Test
    void allowsPostFromAllowedOriginWithClientHeader() throws Exception {
        MockHttpServletRequest r = post("/api/v1/auth/login");
        r.addHeader("Origin", WEB);
        Result res = run(filter(true), r);
        assertTrue(res.passedThrough());
        assertEquals(200, res.status());
    }

    @Test
    void rejectsPostWithoutOriginOrReferer() throws Exception {
        Result res = run(filter(true), post("/api/v1/auth/login"));
        assertEquals(403, res.status());
        assertTrue(res.body().contains("ORIGIN_NOT_ALLOWED"));
    }

    @Test
    void rejectsForeignOrigin() throws Exception {
        MockHttpServletRequest r = post("/api/v1/auth/refresh");
        r.addHeader("Origin", "https://evil.example");
        assertEquals(403, run(filter(true), r).status());
    }

    @Test
    void rejectsOriginThatOnlyStartsWithAnAllowedOne() throws Exception {
        for (String sneaky : new String[] {WEB + ".evil.example", WEB + "@evil.example", "http://localhost:30001", "HTTPS://ALGOVISION.EXAMPLE"}) {
            MockHttpServletRequest r = post("/api/v1/auth/refresh");
            r.addHeader("Origin", sneaky);
            assertEquals(403, run(filter(true), r).status(), sneaky);
        }
    }

    @Test
    void rejectsNullOrigin() throws Exception {
        MockHttpServletRequest r = post("/api/v1/auth/refresh");
        r.addHeader("Origin", "null");
        assertEquals(403, run(filter(true), r).status());
    }

    @Test
    void fallsBackToRefererWhenOriginAbsent() throws Exception {
        MockHttpServletRequest ok = post("/api/v1/auth/refresh");
        ok.addHeader("Referer", WEB + "/algorithms/linked-list-insert-head?step=3");
        assertEquals(200, run(filter(true), ok).status());

        MockHttpServletRequest bad = post("/api/v1/auth/refresh");
        bad.addHeader("Referer", "https://evil.example/" + WEB);
        assertEquals(403, run(filter(true), bad).status());

        MockHttpServletRequest garbage = post("/api/v1/auth/refresh");
        garbage.addHeader("Referer", "::::not a url");
        assertEquals(403, run(filter(true), garbage).status());
    }

    @Test
    void originTakesPrecedenceOverReferer() throws Exception {
        MockHttpServletRequest r = post("/api/v1/auth/refresh");
        r.addHeader("Origin", "https://evil.example");
        r.addHeader("Referer", WEB + "/");
        assertEquals(403, run(filter(true), r).status());
    }

    @Test
    void rejectsMissingOrWrongClientHeader() throws Exception {
        MockHttpServletRequest missing = new MockHttpServletRequest("POST", "/api/v1/auth/login");
        missing.setRequestURI("/api/v1/auth/login");
        missing.addHeader("Origin", WEB);
        Result res = run(filter(true), missing);
        assertEquals(403, res.status());
        assertTrue(res.body().contains("CLIENT_HEADER_MISSING"));

        MockHttpServletRequest wrong = post("/api/v1/auth/login");
        wrong.removeHeader("X-AlgoVision-Client");
        wrong.addHeader("X-AlgoVision-Client", "mobile");
        wrong.addHeader("Origin", WEB);
        assertEquals(403, run(filter(true), wrong).status());
    }

    @Test
    void checksEveryStateChangingMethod() throws Exception {
        for (String method : new String[] {"POST", "PUT", "PATCH", "DELETE"}) {
            MockHttpServletRequest r = new MockHttpServletRequest(method, "/api/v1/bookmarks/1");
            r.setRequestURI("/api/v1/bookmarks/1");
            assertEquals(403, run(filter(true), r).status(), method);
        }
    }

    @Test
    void doesNotInterfereWithSafeMethodsOrNonApiPaths() throws Exception {
        for (String method : new String[] {"GET", "HEAD", "OPTIONS"}) {
            MockHttpServletRequest r = new MockHttpServletRequest(method, "/api/v1/health");
            r.setRequestURI("/api/v1/health");
            assertTrue(run(filter(true), r).passedThrough(), method);
        }
        MockHttpServletRequest other = new MockHttpServletRequest("POST", "/actuator/health");
        other.setRequestURI("/actuator/health");
        assertTrue(run(filter(true), other).passedThrough());
    }

    @Test
    void canBeDisabledForLocalToolingOnly() throws Exception {
        assertTrue(run(filter(false), post("/api/v1/auth/login")).passedThrough());
    }

    @Test
    void errorBodyIsAProblemDocumentWithRequestId() throws Exception {
        MockHttpServletRequest r = post("/api/v1/auth/login");
        r.setAttribute(RequestIdFilter.ATTRIBUTE, "req-12345678");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter(true).doFilter(r, response, new MockFilterChain());
        assertEquals("application/problem+json", response.getContentType().split(";")[0]);
        assertTrue(response.getContentAsString().contains("\"requestId\":\"req-12345678\""));
        assertNotNull(response.getContentAsString());
        assertNull(response.getHeader("Set-Cookie"));
    }
}
