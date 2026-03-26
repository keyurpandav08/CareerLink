package com.keyurpandav.jobber.dto;

import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.enums.StatusType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminJobDto {
    private Long id;
    private String title;
    private String location;
    private Double salary;
    private StatusType status;
    private LocalDate createdAt;
    private String employerName;
    private String employerEmail;
    private int applicationCount;

    public static AdminJobDto toDto(Job job) {
        return AdminJobDto.builder()
                .id(job.getId())
                .title(job.getTitle())
                .location(job.getLocation())
                .salary(job.getSalary())
                .status(job.getStatus())
                .createdAt(job.getCreatedAt())
                .employerName(job.getEmployer() != null ? job.getEmployer().getUsername() : null)
                .employerEmail(job.getEmployer() != null ? job.getEmployer().getEmail() : null)
                .applicationCount(job.getApplications() != null ? job.getApplications().size() : 0)
                .build();
    }
}
