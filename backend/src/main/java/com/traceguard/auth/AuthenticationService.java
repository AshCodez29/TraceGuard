package com.traceguard.auth;

import java.util.Locale;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.traceguard.security.JwtService;
import com.traceguard.user.UserEntity;
import com.traceguard.user.UserRepository;

@Service
public class AuthenticationService {
    private static final Set<String> SUPPORTED_ROLES = Set.of("ADMIN", "DEVELOPER", "AUDITOR");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final String organizationName;

    public AuthenticationService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            @Value("${traceguard.organization-name:Northwind Labs}") String organizationName) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.organizationName = organizationName;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByUsername(request.username())
                .orElseThrow(AuthenticationService::invalidCredentials);

        if (!user.isEnabled() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw invalidCredentials();
        }

        String role = user.getRole().getName().toUpperCase(Locale.ROOT);
        if (!SUPPORTED_ROLES.contains(role)) {
            throw new IllegalStateException("User has an unsupported role configured in the database");
        }

        String token = jwtService.generateToken(user.getUsername(), role);
        return new LoginResponse(token, new UserResponse(user.getUsername(), role, organizationName));
    }

    private static BadCredentialsException invalidCredentials() {
        return new BadCredentialsException("Invalid username or password");
    }
}
