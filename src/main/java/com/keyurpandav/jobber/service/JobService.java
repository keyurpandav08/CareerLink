package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.dto.JobDto;
import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.enums.StatusType;
import com.keyurpandav.jobber.repository.JobRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public JobDto createJobPosting(Job jobData) {
        User employer = getEmployer(jobData.getEmployer().getId());

        Job job = new Job();
        copyJobFields(jobData, job);
        job.setEmployer(employer);

        fillEmployerCompanyDetails(employer, jobData);

        userRepository.save(employer);
        return JobDto.toDto(jobRepository.save(job));
    }

    public Job getJobEntityById(Long id) {
        return getJob(id);
    }

    public List<JobDto> getAllJobs() {
        return jobRepository.findAll().stream()
                .map(JobDto::toDto)
                .toList();
    }

    public List<JobDto> getJobsByUser(Long userId) {
        User employer = getEmployer(userId);
        return jobRepository.findByEmployer(employer).stream()
                .map(JobDto::toDto)
                .toList();
    }

    public JobDto getJobById(Long jobId) {
        return JobDto.toDto(getJob(jobId));
    }

    public boolean deleteJobs(Long jobId) {
        if (!jobRepository.existsById(jobId)) {
            throw new IllegalArgumentException("Job not found with id: " + jobId);
        }
        jobRepository.deleteById(jobId);
        return true;
    }

    public boolean deleteJobForEmployer(Long jobId, Long employerId) {
        Job job = getJob(jobId);

        if (job.getEmployer() == null || !job.getEmployer().getId().equals(employerId)) {
            throw new IllegalArgumentException("You are not allowed to delete this job");
        }

        jobRepository.delete(job);
        return true;
    }

    public JobDto updateJobStatus(Long jobId, StatusType status) {
        Job job = getJob(jobId);
        job.setStatus(status);
        return JobDto.toDto(jobRepository.save(job));
    }

    public JobDto updateJobStatusForEmployer(Long jobId, StatusType status, Long employerId) {
        Job job = getJob(jobId);

        if (job.getEmployer() == null || !job.getEmployer().getId().equals(employerId)) {
            throw new IllegalArgumentException("You are not allowed to update this job");
        }

        job.setStatus(status);
        return JobDto.toDto(jobRepository.save(job));
    }

    public List<JobDto> searchJobs(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return getAllJobs();
        }
        return jobRepository.searchByKeyword(keyword.trim()).stream()
                .map(JobDto::toDto)
                .toList();
    }

    private User getEmployer(Long employerId) {
        return userRepository.findById(employerId)
                .orElseThrow(() -> new IllegalArgumentException("Employer not found with id: " + employerId));
    }

    private Job getJob(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));
    }

    private void copyJobFields(Job source, Job target) {
        target.setTitle(source.getTitle());
        target.setDescription(source.getDescription());
        target.setLocation(source.getLocation());
        target.setSalary(source.getSalary());
        target.setJobType(source.getJobType());
        target.setExperienceLevel(source.getExperienceLevel());
        target.setKeySkills(source.getKeySkills());
        target.setJobHighlights(source.getJobHighlights());
        target.setAboutCompany(source.getAboutCompany());
        target.setJobRequirements(source.getJobRequirements());
        target.setCompanyLogoUrl(source.getCompanyLogoUrl());
        target.setCompanyReviewSummary(source.getCompanyReviewSummary());
        target.setCompanyReviewCount(source.getCompanyReviewCount());
    }

    private void fillEmployerCompanyDetails(User employer, Job jobData) {
        if (isBlank(employer.getCompanyLogoUrl()) && !isBlank(jobData.getCompanyLogoUrl())) {
            employer.setCompanyLogoUrl(jobData.getCompanyLogoUrl().trim());
        }
        if (isBlank(employer.getCompanyOverview()) && !isBlank(jobData.getAboutCompany())) {
            employer.setCompanyOverview(jobData.getAboutCompany().trim());
        }
        if (isBlank(employer.getCompanyReviewSummary()) && !isBlank(jobData.getCompanyReviewSummary())) {
            employer.setCompanyReviewSummary(jobData.getCompanyReviewSummary().trim());
        }
        if (employer.getCompanyReviewCount() == null && jobData.getCompanyReviewCount() != null) {
            employer.setCompanyReviewCount(jobData.getCompanyReviewCount());
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
