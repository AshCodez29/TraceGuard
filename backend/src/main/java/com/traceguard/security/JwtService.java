package com.traceguard.security;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {
    private final SecretKey signingKey;
    private final Duration tokenLifetime;

    public JwtService(
            @Value("${traceguard.jwt.secret}") String secret,
            @Value("${traceguard.jwt.expiry-minutes:480}") long expiryMinutes) {
        byte[] secretBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretBytes.length < 32) {
            throw new IllegalArgumentException("traceguard.jwt.secret must contain at least 32 UTF-8 bytes");
        }
        if (expiryMinutes < 1) {
            throw new IllegalArgumentException("traceguard.jwt.expiry-minutes must be positive");
        }
        this.signingKey = Keys.hmacShaKeyFor(secretBytes);
        this.tokenLifetime = Duration.ofMinutes(expiryMinutes);
    }

    public String generateToken(String username, String role) {
        Instant issuedAt = Instant.now();
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuedAt(Date.from(issuedAt))
                .expiration(Date.from(issuedAt.plus(tokenLifetime)))
                .signWith(signingKey)
                .compact();
    }

    public String extractUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        try {
            Claims claims = parseClaims(token);
            String username = claims.getSubject();
            String role = claims.get("role", String.class);
            boolean roleStillGranted = role != null && userDetails.getAuthorities().stream()
                    .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
            return username != null
                    && username.equals(userDetails.getUsername())
                    && claims.getExpiration() != null
                    && claims.getExpiration().toInstant().isAfter(Instant.now())
                    && roleStillGranted;
        } catch (JwtException | IllegalArgumentException exception) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
