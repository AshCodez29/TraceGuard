package com.traceguard.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.lang.reflect.Proxy;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.traceguard.security.JwtService;
import com.traceguard.user.RoleEntity;
import com.traceguard.user.UserEntity;
import com.traceguard.user.UserRepository;

class AuthenticationServiceTest {
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final JwtService jwtService = new JwtService("auth-test-secret-with-at-least-32-bytes", 10);
    private Map<String, UserEntity> users;
    private AuthenticationService authenticationService;

    @BeforeEach
    void setUp() {
        users = new java.util.HashMap<>();
        authenticationService = new AuthenticationService(
                userRepository(users), passwordEncoder, jwtService, "Northwind Labs");
    }

    @Test
    void successfulLoginVerifiesBcryptAndReturnsUserAndToken() {
        UserEntity user = user("priya", "DEVELOPER", true);
        users.put("priya", user);

        LoginResponse response = authenticationService.login(new LoginRequest("priya", "correct-password"));

        assertEquals("priya", jwtService.extractUsername(response.accessToken()));
        assertEquals("priya", response.user().username());
        assertEquals("DEVELOPER", response.user().role());
        assertEquals("Northwind Labs", response.user().organization());
    }

    @Test
    void incorrectPasswordIsRejected() {
        users.put("priya", user("priya", "DEVELOPER", true));

        assertThrows(BadCredentialsException.class,
                () -> authenticationService.login(new LoginRequest("priya", "wrong-password")));
    }

    @Test
    void unknownUsernameIsRejected() {
        assertThrows(BadCredentialsException.class,
                () -> authenticationService.login(new LoginRequest("missing", "any-password")));
    }

    @Test
    void disabledUserIsRejectedBeforePasswordVerification() {
        users.put("priya", user("priya", "DEVELOPER", false));

        assertThrows(BadCredentialsException.class,
                () -> authenticationService.login(new LoginRequest("priya", "correct-password")));
    }

    private UserEntity user(String username, String role, boolean enabled) {
        return new UserEntity(username, "priya@example.test", passwordEncoder.encode("correct-password"),
                new RoleEntity(role), enabled);
    }

    private static UserRepository userRepository(Map<String, UserEntity> users) {
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findByUsername")) {
                        return Optional.ofNullable(users.get(args[0]));
                    }
                    if (method.getName().equals("toString")) {
                        return "InMemoryUserRepository";
                    }
                    if (method.getName().equals("hashCode")) {
                        return System.identityHashCode(proxy);
                    }
                    if (method.getName().equals("equals")) {
                        return proxy == args[0];
                    }
                    throw new UnsupportedOperationException("Unexpected repository method: " + method.getName());
                });
    }
}
