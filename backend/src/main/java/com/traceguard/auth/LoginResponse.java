package com.traceguard.auth;

public record LoginResponse(String accessToken, UserResponse user) {
}
