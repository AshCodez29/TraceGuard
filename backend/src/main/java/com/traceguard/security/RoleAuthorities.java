package com.traceguard.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.springframework.security.core.authority.SimpleGrantedAuthority;

public final class RoleAuthorities {
    private RoleAuthorities() {
    }

    public static List<SimpleGrantedAuthority> forRole(String roleName) {
        String role = roleName == null ? "" : roleName.toUpperCase(Locale.ROOT);
        List<String> permissions = switch (role) {
            case "ADMIN" -> List.of(
                    "dashboard.view", "users.manage", "projects.viewAll", "projects.create", "projects.manage",
                    "connections.view", "connections.manage", "scan.history", "scan.start", "schema.view",
                    "findings.view", "findings.manage", "traceability.view", "security.view", "reports.view",
                    "reports.generate", "reports.download", "settings.manage", "fix.approve", "fix.dryRun",
                    "fix.verify", "links.review");
            case "DEVELOPER" -> List.of(
                    "dashboard.view", "projects.viewOwnShared", "projects.create", "projects.manageOwn",
                    "connections.view", "connections.manage", "scan.history", "scan.start", "schema.view",
                    "findings.view", "findings.manage", "traceability.view", "security.view", "reports.view",
                    "reports.generate", "reports.download", "fix.propose", "fix.dryRun", "fix.verify", "links.review");
            case "AUDITOR" -> List.of(
                    "dashboard.view", "projects.viewAssigned", "scan.history", "schema.view", "findings.view",
                    "traceability.view", "security.view", "reports.view", "reports.download");
            default -> throw new IllegalArgumentException("Unsupported role configured in the database");
        };

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
        permissions.stream().map(SimpleGrantedAuthority::new).forEach(authorities::add);
        return List.copyOf(authorities);
    }
}
