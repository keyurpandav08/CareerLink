package com.keyurpandav.jobber.dto;

import com.keyurpandav.jobber.entity.User;
import lombok.*;

import java.sql.Timestamp;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String gender;
    private String location;
    private LocalDate dateOfBirth;
    private String skills;
    private String experience;
    private String tenthMarks;
    private String twelfthMarks;
    private String graduation;
    private String profileSummary;
    private String languages;
    private String internships;
    private String projects;
    private String certifications;
    private String resumeUrl;
    private String resumeFileName;
    private String companyName;
    private String companyLogoUrl;
    private String companyOverview;
    private String companyReviewSummary;
    private Integer companyReviewCount;
    private String roleName;
    private Timestamp createdAt;
    private int applicationCount;

    public static UserDto toDto(User u){
        return UserDto.builder()
                .id(u.getId())
                .username(u.getUsername())
                .email(u.getEmail())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .gender(u.getGender())
                .location(u.getLocation())
                .dateOfBirth(u.getDateOfBirth())
                .skills(u.getSkills())
                .experience(u.getExperience())
                .tenthMarks(u.getTenthMarks())
                .twelfthMarks(u.getTwelfthMarks())
                .graduation(u.getGraduation())
                .profileSummary(u.getProfileSummary())
                .languages(u.getLanguages())
                .internships(u.getInternships())
                .projects(u.getProjects())
                .certifications(u.getCertifications())
                .resumeUrl(u.getResumeUrl())
                .resumeFileName(u.getResumeFileName())
                .companyName(u.getCompanyName())
                .companyLogoUrl(u.getCompanyLogoUrl())
                .companyOverview(u.getCompanyOverview())
                .companyReviewSummary(u.getCompanyReviewSummary())
                .companyReviewCount(u.getCompanyReviewCount())
                .roleName(u.getRole().getName())
                .createdAt(u.getCreatedAt())
                .applicationCount(u.getApplications() != null ? u.getApplications().size() : 0)
                .build();
    }
}
