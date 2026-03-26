package com.keyurpandav.jobber.controller;

import com.keyurpandav.jobber.dto.UserDto;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.service.EmailService;
import com.keyurpandav.jobber.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthRecoveryController {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserService userService;
    private final EmailService emailService;
    private final Map<String, OtpSession> otpStore = new ConcurrentHashMap<>();

    @Value("${app.mail.otp-expiry-minutes:10}")
    private long otpExpiryMinutes;

    @Value("${app.oauth.google.client-id:}")
    private String googleClientId;

    @GetMapping("/me")
    public ResponseEntity<?> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }

        User user = userService.getUserByUsername(auth.getName());
        return ResponseEntity.ok(UserDto.toDto(user));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        try {
            String trimmedEmail = email.trim();
            String normalizedEmail = normalizeEmail(trimmedEmail);
            User user = userService.getUserByEmail(trimmedEmail);
            String otp = generateOtp();
            Instant expiresAt = Instant.now().plusSeconds(otpExpiryMinutes * 60);

            otpStore.put(normalizedEmail, new OtpSession(otp, expiresAt, false));
            emailService.sendOtpEmail(user.getEmail(), user.getFullName(), otp, otpExpiryMinutes);

            return ResponseEntity.ok(Map.of(
                    "message", "OTP sent successfully to your email",
                    "expiresInMinutes", otpExpiryMinutes
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", mapForgotPasswordError(e)));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String otp = body.get("otp");
        if (email == null || otp == null || otp.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and OTP are required"));
        }

        String normalizedEmail = normalizeEmail(email);
        OtpSession session = otpStore.get(normalizedEmail);
        if (session == null || session.isExpired() || !session.otp().equals(otp.trim())) {
            otpStore.remove(normalizedEmail);
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }

        otpStore.put(normalizedEmail, session.markVerified());
        return ResponseEntity.ok(Map.of("message", "OTP verified successfully"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String newPassword = body.get("newPassword");
        if (email == null || newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "Valid email and password are required"));
        }

        String trimmedEmail = email.trim();
        String normalizedEmail = normalizeEmail(trimmedEmail);
        OtpSession session = otpStore.get(normalizedEmail);
        if (session == null || session.isExpired()) {
            otpStore.remove(normalizedEmail);
            return ResponseEntity.badRequest().body(Map.of("error", "OTP expired. Please request a new one."));
        }
        if (!session.verified()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Please verify OTP before resetting password"));
        }

        try {
            User updatedUser = userService.updatePassword(trimmedEmail, newPassword);
            otpStore.remove(normalizedEmail);
            try {
                emailService.sendPasswordResetSuccessEmail(updatedUser.getEmail(), updatedUser.getFullName());
            } catch (Exception ignored) {
            }
            return ResponseEntity.ok(Map.of("message", "Password reset successful"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleAuth(@RequestBody Map<String, String> body, HttpServletRequest request) {
        String credential = body.get("credential");
        String fullName = body.get("fullName");

        if (credential == null || credential.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Google credential is required"));
        }

        try {
            Map<String, Object> tokenInfo = verifyGoogleCredential(credential.trim());
            String email = String.valueOf(tokenInfo.getOrDefault("email", ""));
            String emailVerified = String.valueOf(tokenInfo.getOrDefault("email_verified", "false"));
            String audience = String.valueOf(tokenInfo.getOrDefault("aud", ""));

            if (email.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Google account email not available"));
            }
            if (!"true".equalsIgnoreCase(emailVerified)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Google email is not verified"));
            }
            if (!googleClientId.isBlank() && !googleClientId.equals(audience)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Google client mismatch"));
            }

            User user = userService.findOrCreateGoogleApplicant(email, fullName);
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());

            SecurityContext context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            request.getSession(true).setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);

            return ResponseEntity.ok(Map.of(
                    "message", "Google sign-in successful",
                    "user", UserDto.toDto(user)
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Google authentication failed"));
        }
    }

    private String generateOtp() {
        return String.valueOf(100000 + RANDOM.nextInt(900000));
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private Map<String, Object> verifyGoogleCredential(String credential) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(5000);
        requestFactory.setReadTimeout(5000);
        RestTemplate restTemplate = new RestTemplate(requestFactory);

        ResponseEntity<Map> response = restTemplate.exchange(
                "https://oauth2.googleapis.com/tokeninfo?id_token=" + credential,
                HttpMethod.GET,
                HttpEntity.EMPTY,
                Map.class
        );

        return response.getBody() != null ? new HashMap<>(response.getBody()) : Map.of();
    }

    private String mapForgotPasswordError(Exception e) {
        String message = e.getMessage() != null ? e.getMessage() : "Failed to send OTP";
        if (message.toLowerCase().contains("authentication failed")) {
            return "Email login failed. Check spring.mail.username and Gmail app password in application.yml.";
        }
        return message;
    }

    private record OtpSession(String otp, Instant expiresAt, boolean verified) {
        private boolean isExpired() {
            return Instant.now().isAfter(expiresAt);
        }

        private OtpSession markVerified() {
            return new OtpSession(otp, expiresAt, true);
        }
    }
}
