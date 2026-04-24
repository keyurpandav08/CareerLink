package com.keyurpandav.jobber.controller;

import com.keyurpandav.jobber.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicInteractionController {

    private final EmailService emailService;

    @PostMapping("/contact")
    public ResponseEntity<?> submitContact(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "");
        String email = body.getOrDefault("email", "");
        String subject = body.getOrDefault("subject", "CareerLink contact");
        String message = body.getOrDefault("message", "");

        if (name.isBlank() || email.isBlank() || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name, email, and message are required"));
        }

        emailService.sendContactMessage(name, email, subject, message);
        return ResponseEntity.ok(Map.of("message", "Contact request sent successfully"));
    }

    @PostMapping("/review")
    public ResponseEntity<?> submitReview(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "");
        String email = body.getOrDefault("email", "");
        String comment = body.getOrDefault("comment", "");
        Integer rating = parseRating(body.get("rating"));

        if (comment.isBlank() || rating == null || rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "A 1-5 rating and comment are required"));
        }

        emailService.sendReviewMessage(name, email, rating, comment);
        return ResponseEntity.ok(Map.of("message", "Review sent successfully"));
    }

    private Integer parseRating(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            return null;
        }

        try {
            return Integer.parseInt(rawValue.trim());
        } catch (NumberFormatException ignored) {
            return null;
        }
    }
}
