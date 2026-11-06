package dev.algovision.platform.web;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;

class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler();

    private MockHttpServletRequest request() {
        MockHttpServletRequest r = new MockHttpServletRequest("GET", "/api/v1/x");
        r.setAttribute(RequestIdFilter.ATTRIBUTE, "req-abcdef12");
        return r;
    }

    @Test
    void apiExceptionsKeepStatusCodeAndMessage() {
        ResponseEntity<ProblemDetail> res =
                handler.handleApi(new ApiException(HttpStatus.NOT_FOUND, "ALGORITHM_NOT_FOUND", "No such algorithm."), request());
        assertEquals(404, res.getStatusCode().value());
        ProblemDetail body = res.getBody();
        assertNotNull(body);
        assertEquals("No such algorithm.", body.getDetail());
        assertEquals("ALGORITHM_NOT_FOUND", body.getProperties().get("code"));
        assertEquals("req-abcdef12", body.getProperties().get("requestId"));
    }

    @Test
    void unexpectedExceptionsDoNotLeakInternals() {
        ResponseEntity<ProblemDetail> res =
                handler.handleUnexpected(new IllegalStateException("jdbc:postgresql://secret-host/db password=hunter2"), request());
        assertEquals(500, res.getStatusCode().value());
        ProblemDetail body = res.getBody();
        assertNotNull(body);
        assertFalse(String.valueOf(body.getDetail()).contains("hunter2"));
        assertFalse(String.valueOf(body.getDetail()).contains("jdbc"));
        assertEquals("INTERNAL_ERROR", body.getProperties().get("code"));
    }
}
