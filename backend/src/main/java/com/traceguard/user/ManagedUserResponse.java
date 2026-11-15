package com.traceguard.user;

public record ManagedUserResponse(
        Long id,
        String username,
        String email,
        String role,
        boolean enabled,
        boolean active) {
    static ManagedUserResponse from(UserEntity user) {
        return new ManagedUserResponse(
                user.getId(), user.getUsername(), user.getEmail(), user.getRole().getName(),
                user.isEnabled(), user.isEnabled());
    }
}
