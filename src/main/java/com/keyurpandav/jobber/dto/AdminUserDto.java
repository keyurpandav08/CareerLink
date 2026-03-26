package com.keyurpandav.jobber.dto;

import com.keyurpandav.jobber.entity.User;
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
public class AdminUserDto {
    private Long id;
    private String fullName;
    private String username;
    private String email;
    private String phone;
    private String roleName;
    private String skills;
    private String experience;
    private Timestamp createdAt;
    private int applicationCount;
    private int jobCount;

    public static AdminUserDto toDto(User user) {
        return AdminUserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .username(user.getUsername())
                .email(user.getEmail())
                .phone(user.getPhone())
                .roleName(user.getRole() != null ? user.getRole().getName() : null)
                .skills(user.getSkills())
                .experience(user.getExperience())
                .createdAt(user.getCreatedAt())
                .applicationCount(user.getApplications() != null ? user.getApplications().size() : 0)
                .jobCount(user.getJobs() != null ? user.getJobs().size() : 0)
                .build();
    }
}
