package com.traceguard.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserUpdateRequest(
        @Email @Size(max = 120) String email,
        @Pattern(regexp = "(?i)ADMIN|DEVELOPER|AUDITOR") String role,
        Boolean enabled,
        Boolean active) {
    public boolean hasNoUpdates() {
        return email == null && role == null && enabled == null && active == null;
    }

    public boolean effectiveEnabled() {
        return enabled != null ? enabled : Boolean.TRUE.equals(active);
    }
}
