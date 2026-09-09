package com.medipass.auth;

import java.util.UUID;

public record RegisterResponse(
        UUID id,
        String email,
        String role
) {
    public static RegisterResponse from(User user) {
        return new RegisterResponse(user.getId(), user.getEmail(), user.getRole());
    }
}
