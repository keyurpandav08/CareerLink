package com.keyurpandav.jobber.controller;

import com.keyurpandav.jobber.dto.ApplicationDto;
import com.keyurpandav.jobber.dto.JobDto;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.service.ApplicationService;
import com.keyurpandav.jobber.service.JobService;
import com.keyurpandav.jobber.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/employer")
@RequiredArgsConstructor
public class EmployerRestController {

    private final UserService userService;
    private final JobService jobService;
    private final ApplicationService applicationService;

    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        try {
            User employer = getCurrentEmployer();

            List<JobDto> jobs = jobService.getJobsByUser(employer.getId());
            List<ApplicationDto> applications = applicationService.getApplicationsByEmployer(employer.getId());

            return ResponseEntity.ok(Map.of(
                    "employer", Map.of(
                            "id", employer.getId(),
                            "name", employer.getFullName(),
                            "email", employer.getEmail(),
                            "company", employer.getUsername()
                    ),
                    "jobs", jobs,
                    "applications", applications
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    private User getCurrentEmployer() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.getUserByUsername(auth.getName());
        if (!"EMPLOYER".equalsIgnoreCase(user.getRole().getName())) {
            throw new RuntimeException("Only employer can access this resource");
        }
        return user;
    }
}
