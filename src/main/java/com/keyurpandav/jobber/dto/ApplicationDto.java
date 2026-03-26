package com.keyurpandav.jobber.dto;

import com.keyurpandav.jobber.entity.Application;
import lombok.*;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ApplicationDto {
    private Long id;
    private Long applicantId;
    private String applicantFullName;
    private String applicantName;
    private String applicantEmail;
    private String applicantPhone;
    private String applicantSkills;
    private String applicantExperience;
    private String applicantGender;
    private String applicantLocation;
    private LocalDate applicantDateOfBirth;
    private String applicantTenthMarks;
    private String applicantTwelfthMarks;
    private String applicantGraduation;
    private String applicantProfileSummary;
    private String applicantLanguages;
    private String applicantInternships;
    private String applicantProjects;
    private String applicantCertifications;
    private String jobTitle;
    private String jobLocation;
    private String resumeUrl;
    private String resumeFileName;
    private String applicationNote;
    private String status;
    private String appliedAt; // Change to String for formatted date

    public static ApplicationDto toDto(Application a){
        // Format the timestamp
        String formattedDate = "";
        if (a.getAppliedAt() != null) {
            SimpleDateFormat sdf = new SimpleDateFormat("dd/MM/yyyy HH:mm");
            formattedDate = sdf.format(a.getAppliedAt());
        }

        return ApplicationDto.builder()
                .id(a.getId())
                .applicantId(a.getApplicant().getId())
                .applicantFullName(a.getApplicant().getFullName())
                .applicantName(a.getApplicant().getUsername())
                .applicantEmail(a.getApplicant().getEmail())
                .applicantPhone(a.getApplicant().getPhone())
                .applicantSkills(a.getApplicant().getSkills())
                .applicantExperience(a.getApplicant().getExperience())
                .applicantGender(a.getApplicant().getGender())
                .applicantLocation(a.getApplicant().getLocation())
                .applicantDateOfBirth(a.getApplicant().getDateOfBirth())
                .applicantTenthMarks(a.getApplicant().getTenthMarks())
                .applicantTwelfthMarks(a.getApplicant().getTwelfthMarks())
                .applicantGraduation(a.getApplicant().getGraduation())
                .applicantProfileSummary(a.getApplicant().getProfileSummary())
                .applicantLanguages(a.getApplicant().getLanguages())
                .applicantInternships(a.getApplicant().getInternships())
                .applicantProjects(a.getApplicant().getProjects())
                .applicantCertifications(a.getApplicant().getCertifications())
                .jobTitle(a.getJob().getTitle())
                .jobLocation(a.getJob().getLocation())
                .resumeUrl(resolveResumeUrl(a))
                .resumeFileName(resolveResumeFileName(a))
                .applicationNote(a.getApplicationNote())
                .status(a.getStatus().name())
                .appliedAt(formattedDate)
                .build();
    }

    private static String resolveResumeUrl(Application application) {
        if (application.getResumeUrl() != null
                && !application.getResumeUrl().isBlank()
                && !"resume_not_uploaded".equals(application.getResumeUrl())) {
            return application.getResumeUrl();
        }

        if (application.getApplicant() != null
                && application.getApplicant().getResumeUrl() != null
                && !application.getApplicant().getResumeUrl().isBlank()) {
            return application.getApplicant().getResumeUrl();
        }

        return "resume_not_uploaded";
    }

    private static String resolveResumeFileName(Application application) {
        if (application.getApplicant() != null
                && application.getApplicant().getResumeFileName() != null
                && !application.getApplicant().getResumeFileName().isBlank()) {
            return application.getApplicant().getResumeFileName();
        }

        return null;
    }
}
