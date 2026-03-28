package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.entity.Application;
import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.enums.ApplicationStatusType;
import com.keyurpandav.jobber.repository.ApplicationRepository;
import com.keyurpandav.jobber.repository.JobRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final UserRepository userRepository;

    public Map<String, Object> getEmployerAnalytics(Long employerId, LocalDate startDate, LocalDate endDate) {
        List<Job> jobs = jobRepository.findByEmployer(getUser(employerId, "Employer not found"));
        List<Application> allApplications = getEmployerApplications(jobs);
        List<Application> filteredApplications = filterByDateRange(allApplications, startDate, endDate);

        Map<String, Object> analytics = new HashMap<>();

        analytics.put("totalApplications", filteredApplications.size());
        analytics.put("totalJobs", jobs.size());
        analytics.put("pendingApplications", countByStatus(filteredApplications, ApplicationStatusType.PENDING));
        analytics.put("reviewedApplications", countByStatus(filteredApplications, ApplicationStatusType.REVIEWED));
        analytics.put("acceptedApplications", countByStatus(filteredApplications, ApplicationStatusType.ACCEPTED));
        analytics.put("rejectedApplications", countByStatus(filteredApplications, ApplicationStatusType.REJECTED));

        Map<String, Long> applicationsByJob = buildApplicationsByJob(jobs, startDate, endDate);
        analytics.put("applicationsByJob", applicationsByJob);
        analytics.put("applicationsOverTime", getApplicationsOverTime(filteredApplications, 30));
        analytics.put("statusDistribution", buildStatusDistribution(filteredApplications));
        analytics.put("topJobs", buildTopJobs(applicationsByJob));

        return analytics;
    }

    public Map<String, Object> getApplicantAnalytics(Long applicantId, LocalDate startDate, LocalDate endDate) {
        List<Application> applications = applicationRepository.findByApplicant(getUser(applicantId, "Applicant not found"));
        List<Application> filteredApplications = filterByDateRange(applications, startDate, endDate);

        Map<String, Object> analytics = new HashMap<>();

        analytics.put("totalApplications", filteredApplications.size());
        analytics.put("pendingApplications", countByStatus(filteredApplications, ApplicationStatusType.PENDING));
        analytics.put("reviewedApplications", countByStatus(filteredApplications, ApplicationStatusType.REVIEWED));
        analytics.put("acceptedApplications", countByStatus(filteredApplications, ApplicationStatusType.ACCEPTED));
        analytics.put("rejectedApplications", countByStatus(filteredApplications, ApplicationStatusType.REJECTED));

        long total = filteredApplications.size();
        long accepted = countByStatus(filteredApplications, ApplicationStatusType.ACCEPTED);
        double successRate = total > 0 ? (accepted * 100.0 / total) : 0.0;
        analytics.put("successRate", Math.round(successRate * 100.0) / 100.0);

        analytics.put("applicationsOverTime", getApplicationsOverTime(filteredApplications, 30));
        analytics.put("statusDistribution", buildStatusDistribution(filteredApplications));
        analytics.put("applicationsByCompany", buildApplicationsByCompany(filteredApplications));

        return analytics;
    }

    private long countByStatus(List<Application> applications, ApplicationStatusType status) {
        return applications.stream()
                .filter(app -> app.getStatus() == status)
                .count();
    }

    private List<Application> filterByDateRange(List<Application> applications, LocalDate startDate, LocalDate endDate) {
        if (startDate == null && endDate == null) {
            return applications;
        }

        return applications.stream()
                .filter(app -> {
                    LocalDate appliedDate = getAppliedDate(app);
                    if (appliedDate == null) {
                        return false;
                    }
                    if (startDate != null && appliedDate.isBefore(startDate)) {
                        return false;
                    }
                    return endDate == null || !appliedDate.isAfter(endDate);
                })
                .toList();
    }

    private Map<String, Long> getApplicationsOverTime(List<Application> applications, int days) {
        Map<String, Long> overTime = new LinkedHashMap<>();
        LocalDate today = LocalDate.now();

        for (int i = days - 1; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dateKey = date.toString();
            long count = applications.stream()
                    .filter(app -> date.equals(getAppliedDate(app)))
                    .count();
            overTime.put(dateKey, count);
        }

        return overTime;
    }

    private List<Application> getEmployerApplications(List<Job> jobs) {
        List<Application> applications = new ArrayList<>();
        for (Job job : jobs) {
            applications.addAll(applicationRepository.findByJob(job));
        }
        return applications;
    }

    private Map<String, Long> buildApplicationsByJob(List<Job> jobs, LocalDate startDate, LocalDate endDate) {
        Map<String, Long> applicationsByJob = new HashMap<>();
        for (Job job : jobs) {
            List<Application> jobApplications = filterByDateRange(applicationRepository.findByJob(job), startDate, endDate);
            applicationsByJob.put(job.getTitle(), (long) jobApplications.size());
        }
        return applicationsByJob;
    }

    private Map<String, Long> buildStatusDistribution(List<Application> applications) {
        Map<String, Long> statusDistribution = new HashMap<>();
        statusDistribution.put("PENDING", countByStatus(applications, ApplicationStatusType.PENDING));
        statusDistribution.put("REVIEWED", countByStatus(applications, ApplicationStatusType.REVIEWED));
        statusDistribution.put("ACCEPTED", countByStatus(applications, ApplicationStatusType.ACCEPTED));
        statusDistribution.put("REJECTED", countByStatus(applications, ApplicationStatusType.REJECTED));
        return statusDistribution;
    }

    private Map<String, Long> buildTopJobs(Map<String, Long> applicationsByJob) {
        return applicationsByJob.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .collect(LinkedHashMap::new,
                        (map, entry) -> map.put(entry.getKey(), entry.getValue()),
                        LinkedHashMap::putAll);
    }

    private Map<String, Long> buildApplicationsByCompany(List<Application> applications) {
        Map<String, Long> applicationsByCompany = new HashMap<>();
        for (Application application : applications) {
            String company = application.getJob().getEmployer().getUsername();
            applicationsByCompany.put(company, applicationsByCompany.getOrDefault(company, 0L) + 1);
        }
        return applicationsByCompany;
    }

    private LocalDate getAppliedDate(Application application) {
        if (application.getAppliedAt() == null) {
            return null;
        }
        return application.getAppliedAt().toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDate();
    }

    private User getUser(Long userId, String errorMessage) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(errorMessage));
    }
}

