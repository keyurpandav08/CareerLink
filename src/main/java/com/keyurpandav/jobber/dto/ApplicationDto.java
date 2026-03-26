package com.keyurpandav.jobber.dto;

import com.keyurpandav.jobber.entity.Application;
import lombok.*;

import java.sql.Timestamp;
import java.text.SimpleDateFormat;

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
    private String jobTitle;
    private String jobLocation;
    private String resumeUrl;
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
                .jobTitle(a.getJob().getTitle())
                .jobLocation(a.getJob().getLocation())
                .resumeUrl(a.getResumeUrl())
                .applicationNote(a.getApplicationNote())
                .status(a.getStatus().name())
                .appliedAt(formattedDate)
                .build();
    }
}
