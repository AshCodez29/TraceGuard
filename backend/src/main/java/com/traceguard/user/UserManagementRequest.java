package com.traceguard.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UserManagementRequest(
        @NotBlank @Size(max = 50) String username,
        @NotBlank @Email @Size(max = 120) String email,
        @NotBlank @Size(min = 12, max = 256) String password,
        @NotBlank @Pattern(regexp = "(?i)ADMIN|DEVELOPER|AUDITOR") String role) {
}
