package com.keyurpandav.jobber.controller;

import com.keyurpandav.jobber.dto.ApplicationDto;
import com.keyurpandav.jobber.entity.Application;
import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.enums.ApplicationStatusType;
import com.keyurpandav.jobber.repository.JobRepository;
import com.keyurpandav.jobber.service.ApplicationService;
import com.keyurpandav.jobber.service.EmailService;
import com.keyurpandav.jobber.service.ResumeParserService;
import com.keyurpandav.jobber.service.ResumeStorageService;
import com.keyurpandav.jobber.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/applications")
@RequiredArgsConstructor
public class ApplicationRestController {

    private final ApplicationService applicationService;
    private final ResumeParserService resumeParserService;
    private final EmailService emailService;
    private final UserService userService;
    private final JobRepository jobRepository;
    private final ResumeStorageService resumeStorageService;

    @PostMapping("/apply")
    public ResponseEntity<?> applyToJob(
            @RequestParam("userId") Long userId,
            @RequestParam("jobId") Long jobId,
            @RequestParam(value = "applicationNote", required = false) String applicationNote,
            @RequestParam(value = "resume", required = false) MultipartFile resumeFile
    ) {
        try {
            User currentUser = getAuthenticatedUser();
            requireApplicantOwner(currentUser, userId);

            User applicant = userService.getUserById(userId);
            Job job = getJob(jobId);
            String extractedResumeText = extractResumeText(resumeFile);
            String resumeUrl = resolveApplicationResumeUrl(applicant, resumeFile);
            Application application = buildApplication(applicant, job, applicationNote, resumeUrl);
            ApplicationDto createdApplication = saveApplicationAndSendConfirmation(applicant, job, application);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "application", createdApplication,
                    "parsedResumePreview", getResumePreview(extractedResumeText)
            ));

        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Application failed: " + e.getMessage()));
        }
    }

    @PostMapping("/apply-json")
    public ResponseEntity<?> applyToJobJson(@RequestBody Map<String, Object> payload) {
        try {
            Long userId = getRequiredLong(payload, "userId");
            Long jobId = getRequiredLong(payload, "jobId");

            User currentUser = getAuthenticatedUser();
            requireApplicantOwner(currentUser, userId);

            User applicant = userService.getUserById(userId);
            Job job = getJob(jobId);
            String resumeUrl = resolveApplicationResumeUrl(applicant, payload.get("resumeUrl"));

            String applicationNote = payload.get("applicationNote") != null
                    ? String.valueOf(payload.get("applicationNote"))
                    : null;
            Application application = buildApplication(applicant, job, applicationNote, resumeUrl);
            return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.applyToJob(application));
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMyApplications(@PathVariable Long userId) {
        try {
            requireSameUser(getAuthenticatedUser(), userId);

            List<ApplicationDto> applications = applicationService.getApplicationsByUser(userId);
            return ResponseEntity.ok(applications);
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/employer/{employerId}")
    public ResponseEntity<?> getEmployerApplications(@PathVariable Long employerId) {
        try {
            requireSameUser(getAuthenticatedUser(), employerId);

            List<ApplicationDto> applications = applicationService.getApplicationsByEmployer(employerId);
            return ResponseEntity.ok(applications);
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{appId}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long appId, @RequestBody Map<String, String> body) {
        try {
            User employer = requireEmployer(getAuthenticatedUser(), "Only employer can update status");
            ApplicationStatusType statusType = ApplicationStatusType.valueOf(body.getOrDefault("status", "").toUpperCase());
            ApplicationDto updated = applicationService.updateStatusForEmployer(appId, statusType, employer.getId());
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return forbidden(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByUsername(auth.getName());
    }

    private void requireApplicantOwner(User currentUser, Long userId) {
        if (!Objects.equals(currentUser.getId(), userId)
                || !"APPLICANT".equalsIgnoreCase(currentUser.getRole().getName())) {
            throw new SecurityException("Only applicant can apply with own account");
        }
    }

    private void requireSameUser(User currentUser, Long userId) {
        if (!Objects.equals(currentUser.getId(), userId)) {
            throw new SecurityException("Access denied");
        }
    }

    private User requireEmployer(User currentUser, String message) {
        if (!"EMPLOYER".equalsIgnoreCase(currentUser.getRole().getName())) {
            throw new SecurityException(message);
        }
        return currentUser;
    }

    private Application buildApplication(User applicant, Job job, String applicationNote, String resumeUrl) {
        Application application = new Application();
        application.setApplicant(applicant);
        application.setJob(job);
        application.setResumeUrl(resumeUrl);
        application.setApplicationNote(applicationNote);
        return application;
    }

    private String extractResumeText(MultipartFile resumeFile) {
        if (resumeFile == null || resumeFile.isEmpty()) {
            return "No resume file provided.";
        }

        try {
            return resumeParserService.extractContent(resumeFile);
        } catch (Exception e) {
            return "Resume parsing unavailable.";
        }
    }

    private String resolveApplicationResumeUrl(User applicant, Object resumeUrl) {
        if (resumeUrl != null) {
            String candidateResumeUrl = String.valueOf(resumeUrl).trim();
            if (!candidateResumeUrl.isBlank()) {
                return candidateResumeUrl;
            }
        }

        if (applicant.getResumeUrl() != null && !applicant.getResumeUrl().isBlank()) {
            return applicant.getResumeUrl();
        }

        return "resume_not_uploaded";
    }

    private String resolveApplicationResumeUrl(User applicant, MultipartFile resumeFile) {
        if (resumeFile != null && !resumeFile.isEmpty()) {
            ResumeStorageService.StoredResume storedResume = resumeStorageService.storeResume(applicant, resumeFile);
            String resumeUrl = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/users/{userId}/resume")
                    .buildAndExpand(applicant.getId())
                    .toUriString();
            userService.updateResumeMetadata(
                    applicant.getId(),
                    resumeUrl,
                    storedResume.originalFileName(),
                    storedResume.storagePath()
            );
            return resumeUrl;
        }

        return resolveApplicationResumeUrl(applicant, (Object) null);
    }

    private String getResumePreview(String extractedResumeText) {
        return extractedResumeText.length() > 200
                ? extractedResumeText.substring(0, 200) + "..."
                : extractedResumeText;
    }

    private Job getJob(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Job not found"));
    }

    private ApplicationDto saveApplicationAndSendConfirmation(User applicant, Job job, Application application) {
        ApplicationDto createdApplication = applicationService.applyToJob(application);
        try {
            emailService.sendApplicationConfirmation(applicant.getEmail(), job.getTitle());
        } catch (Exception ignored) {
        }
        return createdApplication;
    }

    private Long getRequiredLong(Map<String, Object> payload, String key) {
        Object value = payload.get(key);
        if (value == null) {
            throw new IllegalArgumentException("userId and jobId are required");
        }
        return Long.valueOf(String.valueOf(value));
    }

    private ResponseEntity<Map<String, String>> forbidden(String message) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", message));
    }
}
