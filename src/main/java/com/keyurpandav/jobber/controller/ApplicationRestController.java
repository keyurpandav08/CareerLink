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
import com.keyurpandav.jobber.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found"));

            String extractedResumeText = extractResumeText(resumeFile);
            Application application = buildApplication(applicant, job, applicationNote, getResumeFileName(resumeFile));

            ApplicationDto createdApplication = applicationService.applyToJob(application);

            try {
                emailService.sendApplicationConfirmation(applicant.getEmail(), job.getTitle());
            } catch (Exception ignored) {
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "application", createdApplication,
                            "parsedResumePreview", getResumePreview(extractedResumeText)
                    )
            );

        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Application failed: " + e.getMessage())
            );
        }
    }

    @PostMapping("/apply-json")
    public ResponseEntity<?> applyToJobJson(@RequestBody Map<String, Object> payload) {
        try {
            Object userIdObj = payload.get("userId");
            Object jobIdObj = payload.get("jobId");

            if (userIdObj == null || jobIdObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "userId and jobId are required"));
            }

            Long userId = Long.valueOf(String.valueOf(userIdObj));
            Long jobId = Long.valueOf(String.valueOf(jobIdObj));

            User currentUser = getAuthenticatedUser();
            requireApplicantOwner(currentUser, userId);

            String resumeUrl = payload.get("resumeUrl") != null
                    ? String.valueOf(payload.get("resumeUrl"))
                    : "resume_not_uploaded";

            User applicant = userService.getUserById(userId);
            Job job = jobRepository.findById(jobId)
                    .orElseThrow(() -> new RuntimeException("Job not found"));

            String applicationNote = payload.get("applicationNote") != null
                    ? String.valueOf(payload.get("applicationNote"))
                    : null;
            Application application = buildApplication(applicant, job, applicationNote, resumeUrl);

            ApplicationDto createdApplication = applicationService.applyToJob(application);

            return ResponseEntity.status(HttpStatus.CREATED).body(createdApplication);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getMyApplications(@PathVariable Long userId) {
        try {
            requireSameUser(getAuthenticatedUser(), userId);

            List<ApplicationDto> applications =
                    applicationService.getApplicationsByUser(userId);
            return ResponseEntity.ok(applications);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        }
    }

    @GetMapping("/employer/{employerId}")
    public ResponseEntity<?> getEmployerApplications(@PathVariable Long employerId) {
        try {
            requireSameUser(getAuthenticatedUser(), employerId);

            List<ApplicationDto> applications = applicationService.getApplicationsByEmployer(employerId);
            return ResponseEntity.ok(applications);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", e.getMessage())
            );
        }
    }

    @PutMapping("/{appId}/status")
    public ResponseEntity<?> updateApplicationStatus(@PathVariable Long appId, @RequestBody Map<String, String> body) {
        try {
            User employer = requireEmployer(getAuthenticatedUser(), "Only employer can update status");

            String status = body.getOrDefault("status", "").toUpperCase();
            ApplicationStatusType statusType = ApplicationStatusType.valueOf(status);
            ApplicationDto updated = applicationService.updateStatusForEmployer(appId, statusType, employer.getId());
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
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

    private String getResumeFileName(MultipartFile resumeFile) {
        if (resumeFile == null || resumeFile.isEmpty()) {
            return "resume_not_uploaded";
        }
        return resumeFile.getOriginalFilename();
    }

    private String getResumePreview(String extractedResumeText) {
        return extractedResumeText.length() > 200
                ? extractedResumeText.substring(0, 200) + "..."
                : extractedResumeText;
    }
}
