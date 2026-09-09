package com.medipass.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.UUID;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final long refreshDays;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, @Value("${medipass.jwt.refresh-days}") long refreshDays) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshDays = refreshDays;
    }

    @Transactional
    public User register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) throw new EmailAlreadyRegisteredException();
        try { return userRepository.saveAndFlush(new User(email, passwordEncoder.encode(request.password()))); }
        catch (DataIntegrityViolationException ex) { throw new EmailAlreadyRegisteredException(); }
    }

    @Transactional
    public AuthTokensResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) throw new InvalidCredentialsException();
        return issueTokens(user);
    }

    @Transactional
    public AuthTokensResponse refresh(String rawToken) {
        RefreshToken token = refreshTokenRepository.findByTokenHash(sha256Hex(rawToken))
                .orElseThrow(InvalidRefreshTokenException::new);
        if (!token.isUsable()) throw new InvalidRefreshTokenException();
        token.revoke();
        return issueTokens(token.getUser());
    }

    @Transactional
    public void logout(String rawToken) {
        refreshTokenRepository.findByTokenHash(sha256Hex(rawToken)).ifPresent(RefreshToken::revoke);
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(String userId) {
        try { return userRepository.findById(UUID.fromString(userId)).orElseThrow(InvalidCredentialsException::new); }
        catch (IllegalArgumentException ex) { throw new InvalidCredentialsException(); }
    }

    private AuthTokensResponse issueTokens(User user) {
        String accessToken = jwtService.createAccessToken(user);
        String refreshToken = generateRefreshToken();
        refreshTokenRepository.save(new RefreshToken(user, sha256Hex(refreshToken), Instant.now().plus(refreshDays, ChronoUnit.DAYS)));
        return new AuthTokensResponse(accessToken, refreshToken, "Bearer", jwtService.getAccessTokenLifetimeSeconds());
    }

    private String generateRefreshToken() {
        byte[] bytes = new byte[48]; secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return java.util.HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) { throw new IllegalStateException("SHA-256 is unavailable.", ex); }
    }
}
