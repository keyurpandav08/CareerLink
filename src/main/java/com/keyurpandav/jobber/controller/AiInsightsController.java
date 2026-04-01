package com.keyurpandav.jobber.controller;

import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.service.AiInsightsService;
import com.keyurpandav.jobber.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiInsightsController {

    private final AiInsightsService aiInsightsService;
    private final UserService userService;

    @GetMapping("/candidate/{userId}/dashboard")
    public ResponseEntity<?> getCandidateDashboard(@PathVariable Long userId) {
        try {
            User currentUser = getAuthenticatedUser();
            requireRoleAndOwner(currentUser, userId, "APPLICANT");
            return ResponseEntity.ok(aiInsightsService.buildCandidateDashboard(userId));
        } catch (SecurityException exception) {
            return forbidden(exception.getMessage());
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/candidate/{userId}/job/{jobId}")
    public ResponseEntity<?> getCandidateJobInsight(@PathVariable Long userId, @PathVariable Long jobId) {
        try {
            User currentUser = getAuthenticatedUser();
            requireRoleAndOwner(currentUser, userId, "APPLICANT");
            return ResponseEntity.ok(aiInsightsService.buildJobMatchInsight(userId, jobId));
        } catch (SecurityException exception) {
            return forbidden(exception.getMessage());
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    @GetMapping("/recruiter/{employerId}/applications")
    public ResponseEntity<?> getRecruiterInsights(@PathVariable Long employerId) {
        try {
            User currentUser = getAuthenticatedUser();
            requireRoleAndOwner(currentUser, employerId, "EMPLOYER");
            return ResponseEntity.ok(aiInsightsService.buildRecruiterInsights(employerId));
        } catch (SecurityException exception) {
            return forbidden(exception.getMessage());
        } catch (Exception exception) {
            return ResponseEntity.badRequest().body(Map.of("error", exception.getMessage()));
        }
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByUsername(auth.getName());
    }

    private void requireRoleAndOwner(User user, Long ownerId, String requiredRole) {
        if (!Objects.equals(user.getId(), ownerId) || user.getRole() == null || !requiredRole.equalsIgnoreCase(user.getRole().getName())) {
            throw new SecurityException("Access denied");
        }
    }

    private ResponseEntity<Map<String, String>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", message));
    }
}
