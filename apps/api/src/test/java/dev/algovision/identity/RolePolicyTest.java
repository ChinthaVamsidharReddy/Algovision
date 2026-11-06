package dev.algovision.identity;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.algovision.platform.config.AppProperties;
import dev.algovision.platform.web.ApiException;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;

class RolePolicyTest {

    private static RolePolicy policy(boolean instructorEnabled) {
        return new RolePolicy(new AppProperties(
                List.of("http://localhost:3000"),
                new AppProperties.OriginCheck(true, "X-AlgoVision-Client", "web"),
                new AppProperties.Roles(instructorEnabled)));
    }

    @Test
    void instructorIsNotAssignableInMvp1() {
        RolePolicy p = policy(false);
        assertEquals(Set.of(RolePolicy.STUDENT, RolePolicy.ADMIN), p.assignableRoles());
        ApiException ex = assertThrows(ApiException.class, () -> p.requireAssignable(RolePolicy.INSTRUCTOR));
        assertEquals("ROLE_NOT_AVAILABLE", ex.code());
        assertEquals(400, ex.status().value());
    }

    @Test
    void studentAndAdminAreAssignable() {
        RolePolicy p = policy(false);
        assertDoesNotThrow(() -> p.requireAssignable(RolePolicy.STUDENT));
        assertDoesNotThrow(() -> p.requireAssignable(RolePolicy.ADMIN));
    }

    @Test
    void unknownAndNullRolesAreRejected() {
        RolePolicy p = policy(false);
        for (String role : new String[] {null, "", "ROLE_ROOT", "role_student"}) {
            assertThrows(ApiException.class, () -> p.requireAssignable(role), String.valueOf(role));
        }
    }

    @Test
    void flagIsTheOnlyWayToAllowInstructorAndIsOffByDefault() {
        assertFalse(new AppProperties.Roles(false).instructorEnabled());
        assertTrue(policy(true).assignableRoles().contains(RolePolicy.INSTRUCTOR));
    }
}
