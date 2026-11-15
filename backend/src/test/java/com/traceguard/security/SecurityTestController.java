package com.traceguard.security;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class SecurityTestController {
    @GetMapping("/api/test/protected")
    String protectedResource() {
        return "protected";
    }

    @GetMapping("/api/test/admin")
    @PreAuthorize("hasAuthority('users.manage')")
    String adminResource() {
        return "admin";
    }
}
