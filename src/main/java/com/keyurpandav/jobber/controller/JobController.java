package com.keyurpandav.jobber.controller;
import com.keyurpandav.jobber.dto.ApplicationDto;
import com.keyurpandav.jobber.dto.JobDto;
import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.enums.ApplicationStatusType;
import com.keyurpandav.jobber.enums.StatusType;
import com.keyurpandav.jobber.service.ApplicationService;
import com.keyurpandav.jobber.service.JobService;
import com.keyurpandav.jobber.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@RestController
@RequestMapping("/job")
@RequiredArgsConstructor
public class JobController {
    private final JobService jobService;
    private final ApplicationService applicationService;
    private final UserService userService;
    
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Job job, BindingResult bindingResult) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(error -> 
                errors.put(error.getField(), error.getDefaultMessage())
            );
            return ResponseEntity.badRequest().body(errors);
        }
        
        try {
            User employer = requireEmployer(getAuthenticatedUser(), "Only employer can create jobs");
            job.setEmployer(employer);

            JobDto createdJob = jobService.CreateJobPosting(job);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdJob);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @PutMapping("/applications/{appId}/status")
    public ResponseEntity<?> updateAppStatus(@PathVariable Long appId, @RequestBody String status) {
        try {
            User employer = getAuthenticatedUser();
            ApplicationStatusType statusType = ApplicationStatusType.valueOf(status);
            ApplicationDto updatedApp = applicationService.updateStatusForEmployer(appId, statusType, employer.getId());
            return ResponseEntity.ok(updatedApp);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Invalid status value. Must be one of: " + 
                    String.join(", ", getValidStatuses())));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    @GetMapping
    public List<JobDto> getAllJobs(@RequestParam(value = "search", required = false) String keyword){
        if (keyword != null && !keyword.trim().isEmpty()) {
            return jobService.searchJobs(keyword);
        }
        return jobService.getAllJobs();
    }
    
    @GetMapping("/search")
    public List<JobDto> searchJobs(@RequestParam("keyword") String keyword){
        return jobService.searchJobs(keyword);
    }
    
    @GetMapping("/user/{myid}")
    public ResponseEntity<?> getJobsByUser(@PathVariable Long myid){
        User currentUser = getAuthenticatedUser();
        if (!Objects.equals(currentUser.getId(), myid)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(jobService.getjobsbyusers(myid));
    }
    
    @GetMapping("/{myid}")
    public JobDto getJobById(@PathVariable Long myid){
        return jobService.getjobsbyid(myid);
    }
    
    @DeleteMapping("/{myid}")
    public ResponseEntity<?> deleteJobById(@PathVariable Long myid){
        try {
            User currentUser = getAuthenticatedUser();
            jobService.deleteJobForEmployer(myid, currentUser.getId());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{jobId}/status")
    public ResponseEntity<?> updateJobStatus(@PathVariable Long jobId, @RequestBody Map<String, String> body) {
        try {
            User currentUser = getAuthenticatedUser();
            String rawStatus = body.getOrDefault("status", "").trim();
            StatusType status = "open".equalsIgnoreCase(rawStatus) ? StatusType.Open : StatusType.Close;
            JobDto updated = jobService.updateJobStatusForEmployer(jobId, status, currentUser.getId());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    private String[] getValidStatuses() {
        return java.util.Arrays.stream(ApplicationStatusType.values())
            .map(Enum::name)
            .toArray(String[]::new);
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userService.getUserByUsername(auth.getName());
    }

    private User requireEmployer(User user, String message) {
        if (!"EMPLOYER".equalsIgnoreCase(user.getRole().getName())) {
            throw new SecurityException(message);
        }
        return user;
    }
}
