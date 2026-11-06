package dev.algovision.platform.web;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Writes an RFC 9457 problem document from servlet filters, which run before Spring MVC's error
 * handling. Only fixed, code-defined strings are passed in, but values are still escaped.
 */
final class ProblemJson {

    private ProblemJson() {}

    static void write(HttpServletResponse response, int status, String title, String code, String detail, String requestId)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/problem+json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        StringBuilder json = new StringBuilder(160)
                .append("{\"type\":\"about:blank\",\"title\":").append(quote(title))
                .append(",\"status\":").append(status)
                .append(",\"detail\":").append(quote(detail))
                .append(",\"code\":").append(quote(code));
        if (requestId != null) {
            json.append(",\"requestId\":").append(quote(requestId));
        }
        json.append('}');
        response.getWriter().write(json.toString());
    }

    static String quote(String s) {
        StringBuilder out = new StringBuilder(s.length() + 2).append('"');
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) {
                        out.append(String.format("\\u%04x", (int) c));
                    } else {
                        out.append(c);
                    }
                }
            }
        }
        return out.append('"').toString();
    }
}
