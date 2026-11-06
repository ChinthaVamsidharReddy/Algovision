package dev.algovision.platform.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RequestIdFilterTest {

    private final RequestIdFilter filter = new RequestIdFilter();

    private MockHttpServletResponse run(String supplied) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/health");
        if (supplied != null) {
            request.addHeader(RequestIdFilter.HEADER, supplied);
        }
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, new MockFilterChain());
        return response;
    }

    @Test
    void generatesAnIdWhenAbsent() throws Exception {
        String id = run(null).getHeader(RequestIdFilter.HEADER);
        assertTrue(id != null && id.length() >= 32);
    }

    @Test
    void keepsASafeSuppliedId() throws Exception {
        assertEquals("abc-12345678", run("abc-12345678").getHeader(RequestIdFilter.HEADER));
    }

    @Test
    void replacesUnsafeOrOversizedIds() throws Exception {
        for (String bad : new String[] {"short", "has space in it 123", "evil\r\nSet-Cookie: x=1", "a".repeat(65), "<script>alert(1)</script>"}) {
            String id = run(bad).getHeader(RequestIdFilter.HEADER);
            assertNotEquals(bad, id, bad);
            assertTrue(id.matches("^[A-Za-z0-9-]{8,64}$"));
        }
    }

    @Test
    void clearsMdcAfterTheRequest() throws Exception {
        run(null);
        assertNull(MDC.get(RequestIdFilter.MDC_KEY));
    }
}
