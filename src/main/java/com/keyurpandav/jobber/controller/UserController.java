package com.keyurpandav.jobber.controller;

import com.keyurpandav.jobber.dto.UserDto;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.repository.ApplicationRepository;
import com.keyurpandav.jobber.service.ResumeAnalysisService;
import com.keyurpandav.jobber.service.ResumeParserService;
import com.keyurpandav.jobber.service.ResumeStorageService;
import com.keyurpandav.jobber.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;
    private final ResumeParserService resumeParserService;
    private final ResumeAnalysisService resumeAnalysisService;
    private final ResumeStorageService resumeStorageService;
    private final ApplicationRepository applicationRepository;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody User user, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(getValidationErrors(bindingResult));
        }
        
        try {
            UserDto registeredUser = userService.register(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredUser);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<?> all() {
        User currentUser = getAuthenticatedUser();
        if (!isAdmin(currentUser)) {
            return forbidden("Only admin can view all users");
        }
        return ResponseEntity.ok(userService.getAll());
    }
    
    @GetMapping("/email/{email}")
    public ResponseEntity<?> byEmail(@PathVariable String email) {
        User currentUser = getAuthenticatedUser();
        UserDto user = userService.getByEmail(email);
        if (!isAdmin(currentUser) && !email.equalsIgnoreCase(currentUser.getEmail())) {
            return forbidden("Access denied");
        }
        return ResponseEntity.ok(user);
    }

    @GetMapping("/username/{username}")
    public ResponseEntity<?> byUsername(@PathVariable String username) {
        User currentUser = getAuthenticatedUser();
        if (!isAdmin(currentUser) && !username.equalsIgnoreCase(currentUser.getUsername())) {
            return forbidden("Access denied");
        }
        return ResponseEntity.ok(UserDto.toDto(userService.getUserByUsername(username)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfile(@PathVariable Long id, @RequestBody User updatedUser) {
        try {
            User currentUser = getAuthenticatedUser();
            requireSelfOrAdmin(currentUser, id);
            UserDto updated = userService.updateUserProfile(id, updatedUser);
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return badRequest(e);
        }
    }

    @PostMapping("/upload-resume")
    public ResponseEntity<?> uploadResume(
            @RequestParam("userId") Long userId,
            @RequestParam("resume") MultipartFile resumeFile,
            @RequestParam(value = "targetRole", required = false) String targetRole
    ) {
        try {
            User currentUser = getAuthenticatedUser();
            requireSelfOrAdmin(currentUser, userId);

            User user = userService.getUserById(userId);
            String resumeText = resumeParserService.extractContent(resumeFile);
            Map<String, Object> analysis = resumeAnalysisService.analyze(resumeText, targetRole, user.getSkills());
            UserDto updatedUser = saveUploadedResume(user, resumeFile);
            String resumeUrl = updatedUser.getResumeUrl();

            return ResponseEntity.ok(Map.of(
                    "message", "Resume uploaded and analyzed successfully",
                    "fileName", resumeFile.getOriginalFilename(),
                    "resumeUrl", resumeUrl,
                    "user", updatedUser,
                    "analysis", analysis
            ));
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/resume")
    public ResponseEntity<?> viewResume(@PathVariable Long id) {
        try {
            User currentUser = getAuthenticatedUser();
            User applicant = userService.getUserById(id);

            if (!canAccessResume(currentUser, applicant)) {
                return forbidden("Access denied");
            }
            if (applicant.getResumeStoragePath() == null || applicant.getResumeStoragePath().isBlank()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Resume not found"));
            }

            Resource resource = resumeStorageService.loadAsResource(applicant.getResumeStoragePath());
            MediaType mediaType = MediaTypeFactory.getMediaType(resource)
                    .orElse(MediaType.APPLICATION_OCTET_STREAM);
            String fileName = applicant.getResumeFileName() != null && !applicant.getResumeFileName().isBlank()
                    ? applicant.getResumeFileName()
                    : "resume";

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                    .body(resource);
        } catch (Exception e) {
            return badRequest(e);
        }
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByUsername(auth.getName());
    }

    private boolean isAdmin(User user) {
        return user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName());
    }

    private boolean canAccessResume(User currentUser, User applicant) {
        if (isAdmin(currentUser) || applicant.getId().equals(currentUser.getId())) {
            return true;
        }

        return currentUser.getRole() != null
                && "EMPLOYER".equalsIgnoreCase(currentUser.getRole().getName())
                && applicationRepository.existsByApplicantIdAndJobEmployerId(applicant.getId(), currentUser.getId());
    }

    private Map<String, String> getValidationErrors(BindingResult bindingResult) {
        Map<String, String> errors = new HashMap<>();
        bindingResult.getFieldErrors().forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));
        return errors;
    }

    private void requireSelfOrAdmin(User currentUser, Long userId) {
        if (!isAdmin(currentUser) && !userId.equals(currentUser.getId())) {
            throw new SecurityException("Access denied");
        }
    }

    private UserDto saveUploadedResume(User user, MultipartFile resumeFile) {
        ResumeStorageService.StoredResume storedResume = resumeStorageService.storeResume(user, resumeFile);
        String resumeUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/users/{userId}/resume")
                .buildAndExpand(user.getId())
                .toUriString();

        if (user.getResumeStoragePath() != null && !user.getResumeStoragePath().isBlank()) {
            resumeStorageService.deleteIfExists(user.getResumeStoragePath());
        }

        return userService.updateResumeMetadata(
                user.getId(),
                resumeUrl,
                storedResume.originalFileName(),
                storedResume.storagePath()
        );
    }

    private ResponseEntity<Map<String, String>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", message));
    }

    private ResponseEntity<Map<String, String>> badRequest(Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
