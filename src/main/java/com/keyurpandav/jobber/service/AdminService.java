package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.dto.AdminApplicationDto;
import com.keyurpandav.jobber.dto.AdminJobDto;
import com.keyurpandav.jobber.dto.AdminUserDto;
import com.keyurpandav.jobber.entity.Application;
import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.entity.Role;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.enums.ApplicationStatusType;
import com.keyurpandav.jobber.enums.StatusType;
import com.keyurpandav.jobber.repository.ApplicationRepository;
import com.keyurpandav.jobber.repository.JobRepository;
import com.keyurpandav.jobber.repository.RoleRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationService applicationService;

    public Map<String, Object> getDashboard() {
        List<User> users = userRepository.findAll();
        List<Job> jobs = jobRepository.findAll();
        List<Application> applications = applicationRepository.findAll();

        Map<String, Object> overview = new LinkedHashMap<>();
        overview.put("totalUsers", users.size());
        overview.put("applicants", countUsersByRole(users, "APPLICANT"));
        overview.put("employers", countUsersByRole(users, "EMPLOYER"));
        overview.put("admins", countUsersByRole(users, "ADMIN"));
        overview.put("activeJobs", jobs.stream().filter(job -> job.getStatus() == StatusType.Open).count());
        overview.put("closedJobs", jobs.stream().filter(job -> job.getStatus() == StatusType.Close).count());
        overview.put("totalApplications", applications.size());
        overview.put("pendingApplications", countApplicationsByStatus(applications, ApplicationStatusType.PENDING));
        overview.put("acceptedApplications", countApplicationsByStatus(applications, ApplicationStatusType.ACCEPTED));
        overview.put("rejectedApplications", countApplicationsByStatus(applications, ApplicationStatusType.REJECTED));

        return Map.of(
                "overview", overview,
                "recentUsers", getAllUsers().stream().limit(5).toList(),
                "recentJobs", getAllJobs().stream().limit(5).toList(),
                "recentApplications", getAllApplications().stream().limit(5).toList()
        );
    }

    public List<AdminUserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Timestamp::compareTo)).reversed())
                .map(AdminUserDto::toDto)
                .toList();
    }

    public AdminUserDto updateUserRole(Long userId, String roleName, Long currentAdminId) {
        User user = getUser(userId);
        if (user.getId().equals(currentAdminId)) {
            throw new IllegalArgumentException("You cannot change your own admin role from this panel.");
        }

        String normalizedRole = normalizeRole(roleName);
        Role role = roleRepository.findByName(normalizedRole)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + normalizedRole));

        user.setRole(role);
        return AdminUserDto.toDto(userRepository.save(user));
    }

    public void deleteUser(Long userId, Long currentAdminId) {
        User user = getUser(userId);
        if (user.getId().equals(currentAdminId)) {
            throw new IllegalArgumentException("You cannot delete the account currently logged in.");
        }
        if (user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole().getName())) {
            throw new IllegalArgumentException("Admin accounts cannot be deleted from the admin panel.");
        }

        userRepository.delete(user);
    }

    public List<AdminJobDto> getAllJobs() {
        return jobRepository.findAll().stream()
                .sorted(Comparator.comparing(Job::getCreatedAt, Comparator.nullsLast(LocalDate::compareTo)).reversed())
                .map(AdminJobDto::toDto)
                .toList();
    }

    public AdminJobDto updateJobStatus(Long jobId, StatusType status) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));
        job.setStatus(status);
        return AdminJobDto.toDto(jobRepository.save(job));
    }

    public void deleteJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));
        jobRepository.delete(job);
    }

    public List<AdminApplicationDto> getAllApplications() {
        return applicationRepository.findAll().stream()
                .sorted(Comparator.comparing(Application::getAppliedAt, Comparator.nullsLast(Timestamp::compareTo)).reversed())
                .map(AdminApplicationDto::toDto)
                .toList();
    }

    public AdminApplicationDto updateApplicationStatus(Long applicationId, ApplicationStatusType status) {
        applicationService.updateStatusForAdmin(applicationId, status);
        return AdminApplicationDto.toDto(applicationService.getApplicationById(applicationId));
    }

    private long countUsersByRole(List<User> users, String roleName) {
        return users.stream()
                .filter(user -> user.getRole() != null)
                .filter(user -> roleName.equalsIgnoreCase(user.getRole().getName()))
                .count();
    }

    private long countApplicationsByStatus(List<Application> applications, ApplicationStatusType status) {
        return applications.stream()
                .filter(application -> application.getStatus() == status)
                .count();
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
    }

    private String normalizeRole(String roleName) {
        if (roleName == null || roleName.isBlank()) {
            throw new IllegalArgumentException("Role name is required");
        }
        return roleName.trim().toUpperCase(Locale.ROOT);
    }
}
