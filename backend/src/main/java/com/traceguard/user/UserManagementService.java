package com.traceguard.user;

import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserManagementService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<ManagedUserResponse> list() {
        return userRepository.findAll().stream().map(ManagedUserResponse::from).toList();
    }

    @Transactional
    public ManagedUserResponse create(UserManagementRequest request) {
        String username = request.username().trim();
        String email = request.email().trim();
        ensureUnique(username, email);
        RoleEntity role = findRole(request.role());
        UserEntity saved = userRepository.save(new UserEntity(
                username, email, passwordEncoder.encode(request.password()), role, true));
        return ManagedUserResponse.from(saved);
    }

    @Transactional
    public ManagedUserResponse update(long id, UserUpdateRequest request) {
        if (request.hasNoUpdates()) {
            throw new UserManagementException(HttpStatus.BAD_REQUEST, "At least one permitted field is required");
        }
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new UserManagementException(HttpStatus.NOT_FOUND, "User not found"));

        String email = request.email() == null ? null : request.email().trim();
        if (email != null && userRepository.existsByEmail(email) && !email.equalsIgnoreCase(user.getEmail())) {
            throw new UserManagementException(HttpStatus.CONFLICT, "Email is already in use");
        }
        if (email != null && !email.equalsIgnoreCase(user.getEmail())) {
            user.updateEmail(email);
        }
        if (request.role() != null) {
            user.updateRole(findRole(request.role()));
        }
        if (request.enabled() != null || request.active() != null) {
            user.updateEnabled(request.effectiveEnabled());
        }
        return ManagedUserResponse.from(userRepository.save(user));
    }

    private void ensureUnique(String username, String email) {
        boolean duplicateUsername = userRepository.existsByUsername(username);
        boolean duplicateEmail = userRepository.existsByEmail(email);
        if (duplicateUsername || duplicateEmail) {
            String message = duplicateUsername && duplicateEmail ? "Username and email are already in use"
                    : duplicateUsername ? "Username is already in use" : "Email is already in use";
            throw new UserManagementException(HttpStatus.CONFLICT, message);
        }
    }

    private RoleEntity findRole(String value) {
        String roleName = value.trim().toUpperCase(Locale.ROOT);
        return roleRepository.findByName(roleName)
                .orElseThrow(() -> new UserManagementException(HttpStatus.BAD_REQUEST, "Invalid role"));
    }
}
