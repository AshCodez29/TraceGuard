package com.traceguard.user;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class UserManagementServiceTest {
    private final UserRepository users = org.mockito.Mockito.mock(UserRepository.class);
    private final RoleRepository roles = org.mockito.Mockito.mock(RoleRepository.class);
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();
    private final RoleEntity admin = new RoleEntity("ADMIN");
    private final RoleEntity developer = new RoleEntity("DEVELOPER");
    private final RoleEntity auditor = new RoleEntity("AUDITOR");
    private UserManagementService service;

    @BeforeEach
    void setUp() {
        service = new UserManagementService(users, roles, encoder);
        when(users.findAll()).thenReturn(List.of());
        when(roles.findByName("ADMIN")).thenReturn(Optional.of(admin));
        when(roles.findByName("DEVELOPER")).thenReturn(Optional.of(developer));
        when(roles.findByName("AUDITOR")).thenReturn(Optional.of(auditor));
    }

    @Test
    void createsUserWithBcryptHashAndSafeResponse() {
        when(users.existsByUsername("jane")).thenReturn(false);
        when(users.existsByEmail("jane@example.test")).thenReturn(false);
        when(users.save(any(UserEntity.class))).thenAnswer(invocation -> {
            UserEntity user = invocation.getArgument(0);
            assertNotEquals("strong-password", user.getPasswordHash());
            assertTrue(encoder.matches("strong-password", user.getPasswordHash()));
            return user;
        });

        ManagedUserResponse created = service.create(request("jane", "jane@example.test", "strong-password", "developer"));

        assertEquals("jane", created.username());
        assertEquals("DEVELOPER", created.role());
        assertTrue(created.enabled());
    }

    @Test
    void rejectsDuplicateUsernameAndEmail() {
        when(users.existsByUsername("taken")).thenReturn(true);
        when(users.existsByEmail("new@example.test")).thenReturn(false);
        UserManagementException username = assertThrows(UserManagementException.class,
                () -> service.create(request("taken", "new@example.test", "strong-password", "ADMIN")));
        assertEquals(HttpStatus.CONFLICT, username.getStatus());

        when(users.existsByUsername("new")).thenReturn(false);
        when(users.existsByEmail("taken@example.test")).thenReturn(true);
        UserManagementException email = assertThrows(UserManagementException.class,
                () -> service.create(request("new", "taken@example.test", "strong-password", "ADMIN")));
        assertEquals(HttpStatus.CONFLICT, email.getStatus());
    }

    @Test
    void rejectsUnknownRole() {
        when(users.existsByUsername("jane")).thenReturn(false);
        when(users.existsByEmail("jane@example.test")).thenReturn(false);
        UserManagementException error = assertThrows(UserManagementException.class,
                () -> service.create(request("jane", "jane@example.test", "strong-password", "OWNER")));
        assertEquals(HttpStatus.BAD_REQUEST, error.getStatus());
    }

    @Test
    void updatesPermittedFieldsAndReturnsNotFoundForMissingUser() throws Exception {
        UserEntity existing = new UserEntity("jane", "old@example.test", "hash", developer, true);
        setId(existing, 12L);
        when(users.findById(12L)).thenReturn(Optional.of(existing));
        when(users.existsByEmail("new@example.test")).thenReturn(false);
        when(users.save(existing)).thenReturn(existing);
        ManagedUserResponse updated = service.update(12L, new UserUpdateRequest("new@example.test", "AUDITOR", false, null));

        assertEquals("new@example.test", updated.email());
        assertEquals("AUDITOR", updated.role());
        assertFalse(updated.enabled());
        when(users.findById(999L)).thenReturn(Optional.empty());
        UserManagementException missing = assertThrows(UserManagementException.class,
                () -> service.update(999L, new UserUpdateRequest("x@example.test", null, null, null)));
        assertEquals(HttpStatus.NOT_FOUND, missing.getStatus());
    }

    private static UserManagementRequest request(String username, String email, String password, String role) {
        return new UserManagementRequest(username, email, password, role);
    }

    private static void setId(UserEntity user, long id) throws Exception {
        Field field = UserEntity.class.getDeclaredField("id");
        field.setAccessible(true);
        field.set(user, id);
    }
}
