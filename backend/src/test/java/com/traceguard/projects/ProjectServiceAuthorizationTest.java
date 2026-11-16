package com.traceguard.projects;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProjectServiceAuthorizationTest {
    private static final String USER_SQL = "SELECT u.user_id,r.name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.username=? AND u.enabled=1";
    private static final String OWNER_SQL = "SELECT owner_id FROM projects WHERE project_id=?";
    private static final String ASSIGNMENT_SQL = "SELECT COUNT(*) FROM project_assignments WHERE project_id=? AND user_id=?";
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private ProjectService service;

    @BeforeEach void setUp() {
        service = new ProjectService(jdbc, new ObjectMapper(), "unit-test-encryption-key", "localhost");
    }

    @Test void adminHasGlobalProjectWriteAccess() {
        setUser("admin", 10L, "ADMIN");
        when(jdbc.queryForList(OWNER_SQL, 42L)).thenReturn(List.of(Map.of("owner_id", 10L)));
        assertDoesNotThrow(() -> service.authorize(42, "admin", true));
    }

    @Test void developerCanWriteOwnedProject() {
        setUser("developer", 11L, "DEVELOPER");
        when(jdbc.queryForList(OWNER_SQL, 42L)).thenReturn(List.of(Map.of("owner_id", 11L)));
        when(jdbc.queryForObject(ASSIGNMENT_SQL, Integer.class, 42L, 11L)).thenReturn(0);
        assertDoesNotThrow(() -> service.authorize(42, "developer", true));
    }

    @Test void auditorCannotWriteEvenWhenAssignedReadOnly() {
        setUser("auditor", 12L, "AUDITOR");
        when(jdbc.queryForList(OWNER_SQL, 42L)).thenReturn(List.of(Map.of("owner_id", 11L)));
        when(jdbc.queryForObject(ASSIGNMENT_SQL, Integer.class, 42L, 12L)).thenReturn(1);
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> service.authorize(42, "auditor", true));
        assertEquals(403, ex.getStatusCode().value());
    }

    private void setUser(String username, long id, String role) {
        when(jdbc.queryForList(USER_SQL, username)).thenReturn(List.of(Map.of("user_id", id, "name", role)));
    }
}
