package dev.algovision.health;

import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Public liveness probe used by the web app's status chip and by uptime checks. No database access. */
@RestController
@RequestMapping("/api/v1")
public class HealthController {

    public record Health(String status, String service, Instant time) {}

    @GetMapping("/health")
    public Health health() {
        return new Health("UP", "algovision-api", Instant.now());
    }
}
