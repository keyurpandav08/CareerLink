package com.keyurpandav.jobber.dto;

import com.keyurpandav.jobber.entity.Application;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.sql.Timestamp;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminApplicationDto {
    private Long id;
    private String applicantName;
    private String applicantEmail;
    private String employerName;
    private String jobTitle;
    private String status;
    private Timestamp appliedAt;
    private String resumeUrl;
    private String applicationNote;

    public static AdminApplicationDto toDto(Application application) {
        return AdminApplicationDto.builder()
                .id(application.getId())
                .applicantName(application.getApplicant() != null ? application.getApplicant().getUsername() : null)
                .applicantEmail(application.getApplicant() != null ? application.getApplicant().getEmail() : null)
                .employerName(application.getJob() != null && application.getJob().getEmployer() != null
                        ? application.getJob().getEmployer().getUsername()
                        : null)
                .jobTitle(application.getJob() != null ? application.getJob().getTitle() : null)
                .status(application.getStatus() != null ? application.getStatus().name() : null)
                .appliedAt(application.getAppliedAt())
                .resumeUrl(application.getResumeUrl())
                .applicationNote(application.getApplicationNote())
                .build();
    }
}
