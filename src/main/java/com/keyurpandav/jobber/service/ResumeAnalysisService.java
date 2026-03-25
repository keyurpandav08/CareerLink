package com.keyurpandav.jobber.service;

import com.keyurpandav.jobber.dto.JobDto;
import com.keyurpandav.jobber.service.JobService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResumeAnalysisService {

    private final JobService jobService;

    private static final Map<String, List<String>> ROLE_SKILLS = Map.of(
            "JAVA_DEVELOPER", List.of("java", "spring boot", "hibernate", "maven", "sql", "rest api"),
            "FRONTEND_DEVELOPER", List.of("html", "css", "javascript", "react", "typescript", "ui"),
            "FULL_STACK_DEVELOPER", List.of("java", "spring boot", "react", "sql", "rest api", "git"),
            "DATA_ANALYST", List.of("excel", "sql", "python", "power bi", "statistics", "tableau")
    );

    private static final List<String> KNOWN_SKILLS = List.of(
            "html", "css", "javascript", "react", "typescript", "java", "spring boot",
            "hibernate", "maven", "sql", "mysql", "postgresql", "python", "excel",
            "power bi", "tableau", "git", "rest api", "node.js", "mongodb"
    );

    public Map<String, Object> analyze(String resumeText, String targetRole, String additionalSkills) {
        String source = (resumeText == null ? "" : resumeText.toLowerCase()) + " " +
                (additionalSkills == null ? "" : additionalSkills.toLowerCase());

        List<String> extractedSkills = KNOWN_SKILLS.stream()
                .filter(source::contains)
                .distinct()
                .collect(Collectors.toList());

        String normalizedTargetRole = normalizeRole(targetRole);
        String recommendedRole = normalizedTargetRole != null
                ? normalizedTargetRole
                : detectBestRole(extractedSkills);

        List<String> roleSkills = ROLE_SKILLS.getOrDefault(recommendedRole, List.of());
        List<String> missingSkills = roleSkills.stream()
                .filter(roleSkill -> extractedSkills.stream().noneMatch(skill -> skill.equalsIgnoreCase(roleSkill)))
                .collect(Collectors.toList());

        String level = extractedSkills.size() <= 2 ? "Beginner" : extractedSkills.size() <= 5 ? "Intermediate" : "Advanced";

        Map<String, List<String>> learningPath = Map.of(
                "beginner", roleSkills.stream().limit(2).collect(Collectors.toList()),
                "intermediate", roleSkills.stream().skip(2).limit(2).collect(Collectors.toList()),
                "advanced", roleSkills.stream().skip(4).collect(Collectors.toList())
        );

        List<Map<String, Object>> suggestedJobs = suggestJobsForRole(recommendedRole);

        return Map.of(
                "recommendedRole", formatRole(recommendedRole),
                "detectedSkills", extractedSkills,
                "missingSkills", missingSkills,
                "level", level,
                "learningPath", learningPath,
                "suggestedJobs", suggestedJobs
        );
    }

    private String detectBestRole(List<String> extractedSkills) {
        String bestRole = "JAVA_DEVELOPER";
        int bestScore = -1;

        for (Map.Entry<String, List<String>> entry : ROLE_SKILLS.entrySet()) {
            int score = (int) entry.getValue().stream()
                    .filter(roleSkill -> extractedSkills.stream().anyMatch(skill -> skill.equalsIgnoreCase(roleSkill)))
                    .count();
            if (score > bestScore) {
                bestScore = score;
                bestRole = entry.getKey();
            }
        }
        return bestRole;
    }

    private List<Map<String, Object>> suggestJobsForRole(String role) {
        String keyword = switch (role) {
            case "FRONTEND_DEVELOPER" -> "frontend";
            case "FULL_STACK_DEVELOPER" -> "full stack";
            case "DATA_ANALYST" -> "analyst";
            default -> "java";
        };

        List<JobDto> jobs = jobService.searchJobs(keyword);
        return jobs.stream().limit(5).map(job -> Map.<String, Object>of(
                "id", job.getId(),
                "title", job.getTitle(),
                "location", job.getLocation(),
                "company", job.getEmployerName()
        )).collect(Collectors.toList());
    }

    private String normalizeRole(String targetRole) {
        if (targetRole == null || targetRole.isBlank()) {
            return null;
        }
        String normalized = targetRole.trim().toUpperCase().replace(' ', '_');
        if (ROLE_SKILLS.containsKey(normalized)) {
            return normalized;
        }
        return null;
    }

    private String formatRole(String role) {
        return Arrays.stream(role.split("_"))
                .map(word -> word.charAt(0) + word.substring(1).toLowerCase())
                .collect(Collectors.joining(" "));
    }
}
