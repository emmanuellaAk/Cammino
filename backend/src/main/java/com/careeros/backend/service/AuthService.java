package com.careeros.backend.service;

import com.careeros.backend.dto.request.*;
import com.careeros.backend.dto.response.ApiResponse;
import com.careeros.backend.dto.response.UserResponse;
import com.careeros.backend.entity.*;
import com.careeros.backend.exception.*;
import com.careeros.backend.repository.*;
import com.careeros.backend.security.JwtProperties;
import com.careeros.backend.security.JwtUtil;
import com.careeros.backend.util.CookieUtil;
import com.careeros.backend.util.TokenHashUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_MINUTES = 15;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final EmailVerificationTokenRepository emailVerificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final JwtUtil jwtUtil;
    private final JwtProperties jwtProperties;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${server.ssl.enabled:false}")
    private boolean sslEnabled;

    // ─── Register ────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<UserResponse> register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            throw new ConflictException("An account with this email already exists");
        }

        validatePasswordStrength(request.getPassword());

        User user = User.builder()
                .email(request.getEmail().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .build();

        userRepository.save(user);

        String token = createEmailVerificationToken(user);
        emailService.sendVerificationEmail(user.getEmail(), token);

        log.info("New user registered: {}", user.getEmail());
        return ApiResponse.success("Account created. Please check your email to verify your account.", UserResponse.from(user));
    }

    // ─── Login ───────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<UserResponse> login(LoginRequest request, HttpServletResponse response) {
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isEmailVerified()) {
            throw new UnauthorizedException("Please verify your email address before logging in");
        }

        if (!user.isAccountNonLocked()) {
            throw new UnauthorizedException("Account is temporarily locked — please try again later");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            handleFailedLogin(user);
            throw new UnauthorizedException("Invalid email or password");
        }

        userRepository.resetLockout(user.getEmail());

        String accessToken = jwtUtil.generateAccessToken(user);
        String rawRefresh = createRefreshToken(user);

        long accessMaxAge = jwtProperties.getAccessTokenExpirationMs() / 1000;
        long refreshMaxAge = jwtProperties.getRefreshTokenExpirationMs() / 1000;

        response.addHeader("Set-Cookie", CookieUtil.create(jwtProperties.getCookieName(), accessToken, accessMaxAge, sslEnabled).toString());
        response.addHeader("Set-Cookie", CookieUtil.create(jwtProperties.getRefreshCookieName(), rawRefresh, refreshMaxAge, sslEnabled).toString());

        log.info("User logged in: {}", user.getEmail());
        return ApiResponse.success("Login successful", UserResponse.from(user));
    }

    // ─── Refresh ─────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<Void> refresh(String rawRefreshToken, HttpServletResponse response) {
        String hash = TokenHashUtil.sha256(rawRefreshToken);

        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired refresh token"));

        if (stored.isExpired()) {
            refreshTokenRepository.delete(stored);
            throw new UnauthorizedException("Refresh token has expired — please log in again");
        }

        User user = stored.getUser();
        refreshTokenRepository.delete(stored);

        String newAccess = jwtUtil.generateAccessToken(user);
        String newRawRefresh = createRefreshToken(user);

        long accessMaxAge = jwtProperties.getAccessTokenExpirationMs() / 1000;
        long refreshMaxAge = jwtProperties.getRefreshTokenExpirationMs() / 1000;

        response.addHeader("Set-Cookie", CookieUtil.create(jwtProperties.getCookieName(), newAccess, accessMaxAge, sslEnabled).toString());
        response.addHeader("Set-Cookie", CookieUtil.create(jwtProperties.getRefreshCookieName(), newRawRefresh, refreshMaxAge, sslEnabled).toString());

        return ApiResponse.success("Token refreshed");
    }

    // ─── Logout ──────────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<Void> logout(String rawRefreshToken, HttpServletResponse response) {
        if (rawRefreshToken != null) {
            String hash = TokenHashUtil.sha256(rawRefreshToken);
            refreshTokenRepository.findByTokenHash(hash)
                    .ifPresent(refreshTokenRepository::delete);
        }

        response.addHeader("Set-Cookie", CookieUtil.clear(jwtProperties.getCookieName(), sslEnabled).toString());
        response.addHeader("Set-Cookie", CookieUtil.clear(jwtProperties.getRefreshCookieName(), sslEnabled).toString());

        return ApiResponse.success("Logged out successfully");
    }

    // ─── Verify email ─────────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<Void> verifyEmail(String token) {
        EmailVerificationToken evt = emailVerificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired verification link"));

        if (evt.isExpired()) {
            emailVerificationTokenRepository.delete(evt);
            throw new BadRequestException("Verification link has expired — please request a new one");
        }

        User user = evt.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        emailVerificationTokenRepository.delete(evt);

        log.info("Email verified for: {}", user.getEmail());
        return ApiResponse.success("Email verified successfully — you can now log in");
    }

    // ─── Resend verification ──────────────────────────────────────────────────

    @Transactional
    public ApiResponse<Void> resendVerification(String email) {
        userRepository.findByEmail(email.toLowerCase()).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                emailVerificationTokenRepository.deleteAllByUserId(user.getId());
                String token = createEmailVerificationToken(user);
                emailService.sendVerificationEmail(user.getEmail(), token);
            }
        });
        // Always return success to prevent email enumeration
        return ApiResponse.success("If that email is registered and unverified, a new link has been sent");
    }

    // ─── Forgot password ──────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<Void> forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.getEmail().toLowerCase()).ifPresent(user -> {
            passwordResetTokenRepository.deleteAllByUserId(user.getId());
            String rawToken = UUID.randomUUID().toString();
            String tokenHash = TokenHashUtil.sha256(rawToken);

            PasswordResetToken prt = PasswordResetToken.builder()
                    .tokenHash(tokenHash)
                    .user(user)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build();

            passwordResetTokenRepository.save(prt);
            emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        });
        // Always return success to prevent email enumeration
        return ApiResponse.success("If that email is registered, a password reset link has been sent");
    }

    // ─── Reset password ───────────────────────────────────────────────────────

    @Transactional
    public ApiResponse<Void> resetPassword(ResetPasswordRequest request) {
        String hash = TokenHashUtil.sha256(request.getToken());

        PasswordResetToken prt = passwordResetTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new BadRequestException("Invalid or expired reset link"));

        if (prt.isExpired() || prt.isUsed()) {
            throw new BadRequestException("Reset link has expired — please request a new one");
        }

        validatePasswordStrength(request.getNewPassword());

        User user = prt.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);

        // Revoke all refresh tokens on password change
        refreshTokenRepository.deleteAllByUserId(user.getId());

        log.info("Password reset for: {}", user.getEmail());
        return ApiResponse.success("Password reset successfully — please log in with your new password");
    }

    // ─── Scheduled cleanup ────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime now = LocalDateTime.now();
        refreshTokenRepository.deleteAllExpired(now);
        emailVerificationTokenRepository.deleteAllExpired(now);
        passwordResetTokenRepository.deleteAllExpired(now);
        log.debug("Expired token cleanup complete");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private String createEmailVerificationToken(User user) {
        String token = UUID.randomUUID().toString();
        EmailVerificationToken evt = EmailVerificationToken.builder()
                .token(token)
                .user(user)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        emailVerificationTokenRepository.save(evt);
        return token;
    }

    private String createRefreshToken(User user) {
        String rawToken = UUID.randomUUID() + UUID.randomUUID().toString();
        String hash = TokenHashUtil.sha256(rawToken);

        RefreshToken rt = RefreshToken.builder()
                .tokenHash(hash)
                .user(user)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshTokenExpirationMs() / 1000))
                .build();
        refreshTokenRepository.save(rt);
        return rawToken;
    }

    private void handleFailedLogin(User user) {
        userRepository.incrementFailedAttempts(user.getEmail());
        int attempts = user.getFailedLoginAttempts() + 1;
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            userRepository.lockAccount(user.getEmail(), LocalDateTime.now().plusMinutes(LOCKOUT_MINUTES));
            log.warn("Account locked after {} failed attempts: {}", attempts, user.getEmail());
        }
    }

    private void validatePasswordStrength(String password) {
        boolean hasUpper = password.chars().anyMatch(Character::isUpperCase);
        boolean hasLower = password.chars().anyMatch(Character::isLowerCase);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);

        if (!hasUpper || !hasLower || !hasDigit) {
            throw new BadRequestException("Password must contain at least one uppercase letter, one lowercase letter, and one number");
        }
    }
}
