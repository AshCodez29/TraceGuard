package com.traceguard.security;

import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.traceguard.auth.AuthenticationService;
import com.traceguard.user.RoleEntity;
import com.traceguard.user.UserEntity;
import com.traceguard.user.UserRepository;
import com.traceguard.user.UserManagementService;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@TestConfiguration(proxyBeanMethods = false)
class SecurityTestBeans {
    private static final JwtService JWT_SERVICE = new JwtService("security-test-secret-with-at-least-32-bytes", 10);
    private static final Map<String, UserEntity> USERS = new HashMap<>();

    @Bean
    @Primary
    JwtService testJwtService() {
        return JWT_SERVICE;
    }

    @Bean
    @Primary
    UserRepository testUserRepository(PasswordEncoder passwordEncoder) {
        USERS.clear();
        USERS.put("priya", new UserEntity("priya", "priya@example.test", passwordEncoder.encode("password"),
                new RoleEntity("DEVELOPER"), true));
        USERS.put("admin", new UserEntity("admin", "admin@example.test", passwordEncoder.encode("password"),
                new RoleEntity("ADMIN"), true));
        USERS.put("auditor", new UserEntity("auditor", "auditor@example.test", passwordEncoder.encode("password"),
                new RoleEntity("AUDITOR"), true));
        return (UserRepository) Proxy.newProxyInstance(
                UserRepository.class.getClassLoader(),
                new Class<?>[]{UserRepository.class},
                (proxy, method, args) -> {
                    if (method.getName().equals("findByUsername")) {
                        return Optional.ofNullable(USERS.get(args[0]));
                    }
                    if (method.getName().equals("toString")) {
                        return "SecurityTestUserRepository";
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

    @Bean
    @Primary
    UserDetailsService testUserDetailsService(UserRepository userRepository) {
        return new TraceGuardUserDetailsService(userRepository);
    }

    @Bean
    @Primary
    AuthenticationService testAuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        return new AuthenticationService(userRepository, passwordEncoder, jwtService, "Northwind Labs");
    }

    @Bean
    @Primary
    UserManagementService testUserManagementService() {
        return org.mockito.Mockito.mock(UserManagementService.class);
    }

    static String token(String username, String role) {
        return JWT_SERVICE.generateToken(username, role);
    }
}
