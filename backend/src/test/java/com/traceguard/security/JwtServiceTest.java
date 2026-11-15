package com.traceguard.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

class JwtServiceTest {
    private static final String TEST_SECRET = "test-only-secret-with-at-least-32-bytes";

    private final JwtService jwtService = new JwtService(TEST_SECRET, 10);

    @Test
    void generatedTokenContainsUsernameAndValidatesForCurrentRole() {
        String token = jwtService.generateToken("priya", "DEVELOPER");
        UserDetails user = User.withUsername("priya")
                .password("not-used-here")
                .authorities(RoleAuthorities.forRole("DEVELOPER"))
                .build();

        assertEquals("priya", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, user));
    }

    @Test
    void tokenIsRejectedWhenAccountRoleNoLongerMatches() {
        String token = jwtService.generateToken("priya", "DEVELOPER");
        UserDetails changedRole = User.withUsername("priya")
                .password("not-used-here")
                .authorities(RoleAuthorities.forRole("AUDITOR"))
                .build();

        assertFalse(jwtService.isTokenValid(token, changedRole));
    }

    @Test
    void tokenSignedWithAnotherKeyIsRejected() {
        String token = jwtService.generateToken("priya", "ADMIN");
        JwtService anotherSigner = new JwtService("another-test-only-secret-with-32-bytes", 10);
        UserDetails user = User.withUsername("priya")
                .password("not-used-here")
                .authorities(RoleAuthorities.forRole("ADMIN"))
                .build();

        assertFalse(anotherSigner.isTokenValid(token, user));
    }
}
