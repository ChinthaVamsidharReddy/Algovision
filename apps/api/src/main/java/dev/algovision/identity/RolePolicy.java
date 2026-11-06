package dev.algovision.identity;

import dev.algovision.platform.config.AppProperties;
import dev.algovision.platform.web.ApiException;
import java.util.LinkedHashSet;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/**
 * Single place that decides which roles may be granted. ROLE_INSTRUCTOR is reserved for a later
 * release: it has no row in the database (see V1__identity.sql) and is rejected here unless the
 * flag is explicitly turned on. Two independent guards, so one mistake cannot enable it.
 */
@Component
public class RolePolicy {

    public static final String STUDENT = "ROLE_STUDENT";
    public static final String ADMIN = "ROLE_ADMIN";
    public static final String INSTRUCTOR = "ROLE_INSTRUCTOR";

    private final Set<String> assignable;

    public RolePolicy(AppProperties properties) {
        Set<String> roles = new LinkedHashSet<>(Set.of(STUDENT, ADMIN));
        if (properties.roles().instructorEnabled()) {
            roles.add(INSTRUCTOR);
        }
        this.assignable = Set.copyOf(roles);
    }

    public Set<String> assignableRoles() {
        return assignable;
    }

    /** @throws ApiException ROLE_NOT_AVAILABLE (400) when the role may not be granted. */
    public void requireAssignable(String role) {
        if (role == null || !assignable.contains(role)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ROLE_NOT_AVAILABLE", "That role is not available.");
        }
    }
}
