package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.dto.ApplicationDto;
import com.keyurpandav.jobber.entity.Application;
import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.enums.ApplicationStatusType;
import com.keyurpandav.jobber.repository.ApplicationRepository;
import com.keyurpandav.jobber.repository.JobRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ApplicationDto applyToJob(Application mydata) {
        User user = userRepository.findById(mydata.getApplicant().getId())
                .orElseThrow(() -> new IllegalArgumentException("No User Found with ID: " + mydata.getApplicant().getId()));

        Job job = jobRepository.findById(mydata.getJob().getId())
                .orElseThrow(() -> new IllegalArgumentException("No Job Found with ID: " + mydata.getJob().getId()));

        Application application = new Application();

        applicationRepository.findByApplicantAndJob(user, job)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("You have already applied for this job.");
                });

        application.setApplicant(user);
        application.setJob(job);
        application.setStatus(ApplicationStatusType.PENDING);
        application.setAppliedAt(Timestamp.valueOf(LocalDateTime.now()));
        application.setResumeUrl(mydata.getResumeUrl());
        application.setApplicationNote(mydata.getApplicationNote());

        Application savedApplication = applicationRepository.save(application);
        return ApplicationDto.toDto(savedApplication);
    }

    public List<ApplicationDto> getApplicationsByUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("No User Found with ID: " + userId));

        List<Application> applications = applicationRepository.findByApplicant(user);
        return applications.stream()
                .map(ApplicationDto::toDto)
                .collect(Collectors.toList());
    }

    public List<ApplicationDto> getApplicationsByJob(Long jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("No Job Found with ID: " + jobId));

        List<Application> applications = applicationRepository.findByJob(job);
        return applications.stream()
                .map(ApplicationDto::toDto)
                .collect(Collectors.toList());
    }

    public List<ApplicationDto> getApplicationsByEmployer(Long employerId) {
        User employer = userRepository.findById(employerId)
                .orElseThrow(() -> new IllegalArgumentException("No Employer Found with ID: " + employerId));

        List<Application> applications = applicationRepository.findByJobEmployer(employer);
        return applications.stream()
                .map(ApplicationDto::toDto)
                .collect(Collectors.toList());
    }
    public boolean deletebyid(Long appId) {
        User user = userRepository.findById(appId)
                .orElseThrow(() -> new IllegalArgumentException("No User Found with ID: " + appId));
        applicationRepository.deleteById(appId);
        return true;
    }
    public ApplicationDto updateStatus(Long appId, ApplicationStatusType updatedStatus) {
        Application application = applicationRepository.findById(appId)
                .orElseThrow(() -> new IllegalArgumentException("No Application Found with ID: " + appId));

        application.setStatus(updatedStatus);
        Application saved = applicationRepository.save(application);
        return ApplicationDto.toDto(saved);
    }

    public ApplicationDto updateStatusForEmployer(Long appId, ApplicationStatusType updatedStatus, Long employerId) {
        Application application = applicationRepository.findById(appId)
                .orElseThrow(() -> new IllegalArgumentException("No Application Found with ID: " + appId));

        if (application.getJob() == null
                || application.getJob().getEmployer() == null
                || !application.getJob().getEmployer().getId().equals(employerId)) {
            throw new IllegalArgumentException("You are not allowed to update this application");
        }

        application.setStatus(updatedStatus);
        Application saved = applicationRepository.save(application);
        sendStatusUpdateNotification(saved, updatedStatus);
        return ApplicationDto.toDto(saved);
    }

    public ApplicationDto updateStatusForAdmin(Long appId, ApplicationStatusType updatedStatus) {
        Application application = applicationRepository.findById(appId)
                .orElseThrow(() -> new IllegalArgumentException("No Application Found with ID: " + appId));

        application.setStatus(updatedStatus);
        Application saved = applicationRepository.save(application);
        sendStatusUpdateNotification(saved, updatedStatus);
        return ApplicationDto.toDto(saved);
    }

    // Add this method if not exists
    public Application getApplicationById(Long appId) {
        return applicationRepository.findById(appId)
                .orElseThrow(() -> new IllegalArgumentException("No Application Found with ID: " + appId));
    }

    private void sendStatusUpdateNotification(Application saved, ApplicationStatusType updatedStatus) {
        if (saved.getApplicant() == null
                || saved.getApplicant().getEmail() == null
                || updatedStatus != ApplicationStatusType.ACCEPTED) {
            return;
        }

        try {
            String fullName = saved.getApplicant().getFullName() != null
                    ? saved.getApplicant().getFullName()
                    : saved.getApplicant().getUsername();
            String employerName = saved.getJob() != null
                    && saved.getJob().getEmployer() != null
                    ? saved.getJob().getEmployer().getUsername()
                    : "Employer";
            String jobTitle = saved.getJob() != null ? saved.getJob().getTitle() : "your application";

            emailService.sendApplicationStatusUpdate(
                    saved.getApplicant().getEmail(),
                    fullName,
                    jobTitle,
                    employerName,
                    updatedStatus.name()
            );
        } catch (Exception ignored) {
        }
    }
}
