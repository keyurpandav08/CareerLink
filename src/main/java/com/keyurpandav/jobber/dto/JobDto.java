package com.keyurpandav.jobber.dto;

import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.enums.StatusType;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class JobDto {
    private Long id;
    private String title;
    private String description;
    private String location;
    private Double salary;
    private String jobType;
    private String experienceLevel;
    private String keySkills;
    private String jobHighlights;
    private String aboutCompany;
    private String jobRequirements;
    private String companyLogoUrl;
    private String companyReviewSummary;
    private Integer companyReviewCount;
    private StatusType status;
    private String employerName;
    private LocalDate createdAt;

    public static JobDto toDto(Job j){
        String employerName = j.getEmployer().getCompanyName() != null && !j.getEmployer().getCompanyName().isBlank()
                ? j.getEmployer().getCompanyName()
                : j.getEmployer().getUsername();

        String companyLogoUrl = j.getCompanyLogoUrl() != null && !j.getCompanyLogoUrl().isBlank()
                ? j.getCompanyLogoUrl()
                : j.getEmployer().getCompanyLogoUrl();

        String aboutCompany = j.getAboutCompany() != null && !j.getAboutCompany().isBlank()
                ? j.getAboutCompany()
                : j.getEmployer().getCompanyOverview();

        String companyReviewSummary = j.getCompanyReviewSummary() != null && !j.getCompanyReviewSummary().isBlank()
                ? j.getCompanyReviewSummary()
                : j.getEmployer().getCompanyReviewSummary();

        Integer companyReviewCount = j.getCompanyReviewCount() != null
                ? j.getCompanyReviewCount()
                : j.getEmployer().getCompanyReviewCount();

        return JobDto.builder()
                .id(j.getId())
                .title(j.getTitle())
                .description(j.getDescription())
                .location(j.getLocation())
                .salary(j.getSalary())
                .jobType(j.getJobType())
                .experienceLevel(j.getExperienceLevel())
                .keySkills(j.getKeySkills())
                .jobHighlights(j.getJobHighlights())
                .aboutCompany(aboutCompany)
                .jobRequirements(j.getJobRequirements())
                .companyLogoUrl(companyLogoUrl)
                .companyReviewSummary(companyReviewSummary)
                .companyReviewCount(companyReviewCount)
                .status(j.getStatus())
                .employerName(employerName)
                .createdAt(j.getCreatedAt())
                .build();
    }

}
