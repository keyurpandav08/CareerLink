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

import java.util.List;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    public ApplicationDto applyToJob(Application applicationData) {
        User applicant = getUser(applicationData.getApplicant().getId());
        Job job = getJob(applicationData.getJob().getId());

        applicationRepository.findByApplicantAndJob(applicant, job)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("You have already applied for this job.");
                });

        Application application = new Application();
        application.setApplicant(applicant);
        application.setJob(job);
        application.setStatus(ApplicationStatusType.PENDING);
        application.setResumeUrl(applicationData.getResumeUrl());
        application.setApplicationNote(applicationData.getApplicationNote());

        return ApplicationDto.toDto(applicationRepository.save(application));
    }

    public List<ApplicationDto> getApplicationsByUser(Long userId) {
        return applicationRepository.findByApplicant(getUser(userId)).stream()
                .map(ApplicationDto::toDto)
                .toList();
    }

    public List<ApplicationDto> getApplicationsByJob(Long jobId) {
        return applicationRepository.findByJob(getJob(jobId)).stream()
                .map(ApplicationDto::toDto)
                .toList();
    }

    public List<ApplicationDto> getApplicationsByEmployer(Long employerId) {
        return applicationRepository.findByJobEmployer(getEmployer(employerId)).stream()
                .map(ApplicationDto::toDto)
                .toList();
    }

    public boolean deletebyid(Long appId) {
        getUser(appId);
        applicationRepository.deleteById(appId);
        return true;
    }

    public ApplicationDto updateStatus(Long appId, ApplicationStatusType updatedStatus) {
        return saveApplicationStatus(appId, updatedStatus, false);
    }

    public ApplicationDto updateStatusForEmployer(Long appId, ApplicationStatusType updatedStatus, Long employerId) {
        Application application = getApplication(appId);

        if (application.getJob() == null
                || application.getJob().getEmployer() == null
                || !application.getJob().getEmployer().getId().equals(employerId)) {
            throw new IllegalArgumentException("You are not allowed to update this application");
        }

        application.setStatus(updatedStatus);
        Application savedApplication = applicationRepository.save(application);
        sendStatusUpdateNotification(savedApplication, updatedStatus);
        return ApplicationDto.toDto(savedApplication);
    }

    public ApplicationDto updateStatusForAdmin(Long appId, ApplicationStatusType updatedStatus) {
        return saveApplicationStatus(appId, updatedStatus, true);
    }

    public Application getApplicationById(Long appId) {
        return getApplication(appId);
    }

    private ApplicationDto saveApplicationStatus(Long appId, ApplicationStatusType status, boolean sendNotification) {
        Application application = getApplication(appId);
        application.setStatus(status);

        Application savedApplication = applicationRepository.save(application);
        if (sendNotification) {
            sendStatusUpdateNotification(savedApplication, status);
        }
        return ApplicationDto.toDto(savedApplication);
    }

    private void sendStatusUpdateNotification(Application application, ApplicationStatusType updatedStatus) {
        if (application.getApplicant() == null
                || application.getApplicant().getEmail() == null
                || updatedStatus != ApplicationStatusType.ACCEPTED) {
            return;
        }

        try {
            String fullName = application.getApplicant().getFullName() != null
                    ? application.getApplicant().getFullName()
                    : application.getApplicant().getUsername();
            String employerName = application.getJob() != null
                    && application.getJob().getEmployer() != null
                    ? application.getJob().getEmployer().getUsername()
                    : "Employer";
            String jobTitle = application.getJob() != null ? application.getJob().getTitle() : "your application";

            emailService.sendApplicationStatusUpdate(
                    application.getApplicant().getEmail(),
                    fullName,
                    jobTitle,
                    employerName,
                    updatedStatus.name()
            );
        } catch (Exception ignored) {
        }
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("No User Found with ID: " + userId));
    }

    private User getEmployer(Long employerId) {
        return userRepository.findById(employerId)
                .orElseThrow(() -> new IllegalArgumentException("No Employer Found with ID: " + employerId));
    }

    private Job getJob(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("No Job Found with ID: " + jobId));
    }

    private Application getApplication(Long appId) {
        return applicationRepository.findById(appId)
                .orElseThrow(() -> new IllegalArgumentException("No Application Found with ID: " + appId));
    }
}
