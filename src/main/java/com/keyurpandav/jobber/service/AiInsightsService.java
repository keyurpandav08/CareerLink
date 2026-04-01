package com.keyurpandav.jobber.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.keyurpandav.jobber.dto.ApplicationDto;
import com.keyurpandav.jobber.dto.JobDto;
import com.keyurpandav.jobber.dto.UserDto;
import com.keyurpandav.jobber.entity.Application;
import com.keyurpandav.jobber.entity.Job;
import com.keyurpandav.jobber.entity.User;
import com.keyurpandav.jobber.enums.StatusType;
import com.keyurpandav.jobber.repository.ApplicationRepository;
import com.keyurpandav.jobber.repository.JobRepository;
import com.keyurpandav.jobber.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiInsightsService {

    private final GeminiClientService geminiClientService;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;

    public Map<String, Object> buildCandidateDashboard(Long userId) {
        User user = getUser(userId);
        List<Application> applications = applicationRepository.findByApplicant(user);
        List<JobDto> liveJobs = getLiveJobs();

        Map<String, Object> context = Map.of(
                "candidate", compactCandidateProfile(user),
                "applications", applications.stream().map(ApplicationDto::toDto).map(this::compactApplication).toList(),
                "liveJobs", liveJobs.stream().limit(16).map(this::compactJob).toList()
        );

        String instruction = """
                You are the JobLithic AI career coach.
                Return strict JSON only with this exact structure:
                {
                  "score": 0,
                  "focusNote": "string",
                  "highlights": [
                    { "tone": "positive", "text": "string" },
                    { "tone": "warning", "text": "string" }
                  ],
                  "recommendations": [
                    {
                      "jobId": 0,
                      "matchScore": 0,
                      "reason": "string",
                      "featured": false,
                      "tags": ["string", "string", "string"]
                    }
                  ]
                }
                Rules:
                - Use only the provided liveJobs jobId values.
                - Return exactly 2 highlights and up to 3 recommendations.
                - Match score must be an integer from 0 to 100.
                - Keep text concise, practical, and recruiter-ready.
                """;

        JsonNode ai = geminiClientService.generateStructuredJson(instruction, context);
        List<Map<String, Object>> recommendations = enrichRecommendations(ai.path("recommendations"), liveJobs);

        return Map.of(
                "score", clamp(ai.path("score").asInt(74), 0, 100),
                "focusNote", defaultText(ai.path("focusNote").asText(), "Live AI recommendations are ready for your next move."),
                "highlights", extractHighlights(ai.path("highlights")),
                "recommendations", recommendations
        );
    }

    public Map<String, Object> buildJobMatchInsight(Long userId, Long jobId) {
        User user = getUser(userId);
        Job job = getJob(jobId);
        List<JobDto> liveJobs = getLiveJobs();

        Map<String, Object> context = Map.of(
                "candidate", compactCandidateProfile(user),
                "targetJob", compactJob(JobDto.toDto(job)),
                "recentApplications", applicationRepository.findByApplicant(user).stream()
                        .map(ApplicationDto::toDto)
                        .limit(6)
                        .map(this::compactApplication)
                        .toList(),
                "similarJobs", liveJobs.stream()
                        .filter(item -> !Objects.equals(item.getId(), jobId))
                        .limit(8)
                        .map(this::compactJob)
                        .toList()
        );

        String instruction = """
                You are the JobLithic AI match analyst.
                Return strict JSON only with this exact structure:
                {
                  "matchScore": 0,
                  "headline": "string",
                  "summary": "string",
                  "topMatches": ["string", "string", "string"],
                  "potentialGaps": ["string", "string"],
                  "action": "string"
                }
                Rules:
                - Base the answer only on the provided candidate and target job.
                - matchScore must be an integer from 0 to 100.
                - topMatches should contain 2 to 4 short items.
                - potentialGaps should contain 0 to 3 short items.
                - action should be one sentence.
                """;

        JsonNode ai = geminiClientService.generateStructuredJson(instruction, context);

        return Map.of(
                "matchScore", clamp(ai.path("matchScore").asInt(78), 0, 100),
                "headline", defaultText(ai.path("headline").asText(), "Promising alignment for this opportunity."),
                "summary", defaultText(ai.path("summary").asText(), "Your experience shows meaningful overlap with this role."),
                "topMatches", extractStringList(ai.path("topMatches"), 4),
                "potentialGaps", extractStringList(ai.path("potentialGaps"), 3),
                "action", defaultText(ai.path("action").asText(), "Tighten your profile summary before applying.")
        );
    }

    public Map<String, Object> buildRecruiterInsights(Long employerId) {
        User employer = getUser(employerId);
        List<Job> jobs = jobRepository.findByEmployer(employer);
        List<Application> applications = applicationRepository.findByJobEmployer(employer);

        Map<String, Object> context = Map.of(
                "employer", Map.of(
                        "id", employer.getId(),
                        "companyName", defaultText(employer.getCompanyName(), employer.getUsername()),
                        "overview", shorten(employer.getCompanyOverview(), 700)
                ),
                "jobs", jobs.stream().map(JobDto::toDto).map(this::compactJob).toList(),
                "applications", applications.stream().map(ApplicationDto::toDto).map(this::compactApplication).toList()
        );

        String instruction = """
                You are the JobLithic recruiter intelligence engine.
                Return strict JSON only with this exact structure:
                {
                  "headline": "string",
                  "summary": "string",
                  "matches": [
                    {
                      "applicationId": 0,
                      "matchScore": 0,
                      "summary": "string",
                      "strengths": ["string", "string"],
                      "risks": ["string"]
                    }
                  ]
                }
                Rules:
                - Use only the provided applicationId values.
                - Score every application in the list with an integer from 0 to 100.
                - strengths and risks should be short bullet-style phrases.
                - Keep recruiter-facing summaries concise and actionable.
                """;

        JsonNode ai = geminiClientService.generateStructuredJson(instruction, context);

        return Map.of(
                "headline", defaultText(ai.path("headline").asText(), "AI ranking is ready for the current candidate pool."),
                "summary", defaultText(ai.path("summary").asText(), "Use the strongest-fit candidates to accelerate review decisions."),
                "matches", extractRecruiterMatches(ai.path("matches"))
        );
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));
    }

    private Job getJob(Long jobId) {
        return jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with id: " + jobId));
    }

    private List<JobDto> getLiveJobs() {
        return jobRepository.findAll().stream()
                .filter(job -> job.getStatus() == StatusType.Open)
                .map(JobDto::toDto)
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .toList();
    }

    private Map<String, Object> compactCandidateProfile(User user) {
        UserDto dto = UserDto.toDto(user);
        return Map.of(
                "id", dto.getId(),
                "fullName", defaultText(dto.getFullName(), dto.getUsername()),
                "headline", defaultText(dto.getExperience(), "Experience not shared"),
                "location", defaultText(dto.getLocation(), "Location not shared"),
                "skills", splitTags(dto.getSkills()),
                "profileSummary", shorten(dto.getProfileSummary(), 900),
                "projects", shorten(dto.getProjects(), 1000),
                "certifications", shorten(dto.getCertifications(), 700),
                "graduation", shorten(dto.getGraduation(), 300),
                "resumeAvailable", dto.getResumeUrl() != null && !dto.getResumeUrl().isBlank()
        );
    }

    private Map<String, Object> compactJob(JobDto job) {
        Map<String, Object> compact = new LinkedHashMap<>();
        compact.put("jobId", job.getId());
        compact.put("title", job.getTitle());
        compact.put("company", defaultText(job.getEmployerName(), "Confidential employer"));
        compact.put("location", defaultText(job.getLocation(), "Location not shared"));
        compact.put("salary", job.getSalary());
        compact.put("jobType", defaultText(job.getJobType(), "Not specified"));
        compact.put("experienceLevel", defaultText(job.getExperienceLevel(), "Not specified"));
        compact.put("keySkills", splitTags(job.getKeySkills()));
        compact.put("jobHighlights", splitTags(job.getJobHighlights()));
        compact.put("jobRequirements", splitTags(job.getJobRequirements()));
        compact.put("description", shorten(job.getDescription(), 1200));
        compact.put("aboutCompany", shorten(job.getAboutCompany(), 900));
        return compact;
    }

    private Map<String, Object> compactApplication(ApplicationDto dto) {
        return Map.of(
                "applicationId", dto.getId(),
                "jobTitle", defaultText(dto.getJobTitle(), "Untitled role"),
                "jobLocation", defaultText(dto.getJobLocation(), "Location not shared"),
                "status", defaultText(dto.getStatus(), "PENDING"),
                "appliedAt", defaultText(dto.getAppliedAt(), "Unknown"),
                "candidate", Map.of(
                        "name", defaultText(dto.getApplicantFullName(), dto.getApplicantName()),
                        "email", defaultText(dto.getApplicantEmail(), "Not shared"),
                        "phone", defaultText(dto.getApplicantPhone(), "Not shared"),
                        "skills", splitTags(dto.getApplicantSkills()),
                        "experience", defaultText(dto.getApplicantExperience(), "Not shared"),
                        "location", defaultText(dto.getApplicantLocation(), "Not shared"),
                        "profileSummary", shorten(dto.getApplicantProfileSummary(), 800),
                        "projects", shorten(dto.getApplicantProjects(), 900),
                        "certifications", shorten(dto.getApplicantCertifications(), 600),
                        "applicationNote", shorten(dto.getApplicationNote(), 700)
                )
        );
    }

    private List<Map<String, Object>> enrichRecommendations(JsonNode node, List<JobDto> liveJobs) {
        Map<Long, JobDto> jobsById = liveJobs.stream()
                .collect(Collectors.toMap(JobDto::getId, job -> job, (left, right) -> left, LinkedHashMap::new));

        List<Map<String, Object>> recommendations = new ArrayList<>();
        if (!node.isArray()) {
            return recommendations;
        }

        for (JsonNode item : node) {
            long jobId = item.path("jobId").asLong(-1);
            JobDto job = jobsById.get(jobId);
            if (job == null) {
                continue;
            }

            recommendations.add(Map.of(
                    "jobId", job.getId(),
                    "title", job.getTitle(),
                    "company", defaultText(job.getEmployerName(), "Confidential employer"),
                    "location", defaultText(job.getLocation(), "Location not shared"),
                    "salary", job.getSalary(),
                    "matchScore", clamp(item.path("matchScore").asInt(75), 0, 100),
                    "reason", defaultText(item.path("reason").asText(), "Strong overlap with your profile."),
                    "featured", item.path("featured").asBoolean(false),
                    "tags", extractStringList(item.path("tags"), 3)
            ));

            if (recommendations.size() == 3) {
                break;
            }
        }

        return recommendations;
    }

    private List<Map<String, Object>> extractHighlights(JsonNode node) {
        List<Map<String, Object>> highlights = new ArrayList<>();
        if (!node.isArray()) {
            return List.of(
                    Map.of("tone", "positive", "text", "Your profile already has a solid foundation."),
                    Map.of("tone", "warning", "text", "Refine role-specific keywords to improve visibility.")
            );
        }

        for (JsonNode item : node) {
            String tone = item.path("tone").asText("positive").toLowerCase();
            if (!List.of("positive", "warning", "opportunity").contains(tone)) {
                tone = "positive";
            }
            highlights.add(Map.of(
                    "tone", tone,
                    "text", defaultText(item.path("text").asText(), "AI insight unavailable.")
            ));
        }

        if (highlights.isEmpty()) {
            highlights.add(Map.of("tone", "positive", "text", "Your profile already has a solid foundation."));
            highlights.add(Map.of("tone", "warning", "text", "Refine role-specific keywords to improve visibility."));
        }

        return highlights.stream().limit(2).toList();
    }

    private List<Map<String, Object>> extractRecruiterMatches(JsonNode node) {
        List<Map<String, Object>> matches = new ArrayList<>();
        if (!node.isArray()) {
            return matches;
        }

        for (JsonNode item : node) {
            long applicationId = item.path("applicationId").asLong(-1);
            if (applicationId < 0) {
                continue;
            }

            matches.add(Map.of(
                    "applicationId", applicationId,
                    "matchScore", clamp(item.path("matchScore").asInt(70), 0, 100),
                    "summary", defaultText(item.path("summary").asText(), "Candidate fit reviewed by AI."),
                    "strengths", extractStringList(item.path("strengths"), 3),
                    "risks", extractStringList(item.path("risks"), 3)
            ));
        }

        return matches;
    }

    private List<String> extractStringList(JsonNode node, int limit) {
        List<String> values = new ArrayList<>();
        if (node.isArray()) {
            for (JsonNode item : node) {
                String value = item.asText("").trim();
                if (!value.isBlank()) {
                    values.add(value);
                }
                if (values.size() == limit) {
                    break;
                }
            }
        }
        return values;
    }

    private List<String> splitTags(String value) {
        return List.of(defaultText(value, "").split("[,|\\n]")).stream()
                .map(String::trim)
                .filter(item -> !item.isBlank())
                .limit(8)
                .toList();
    }

    private String shorten(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "";
        }
        String trimmed = value.trim();
        return trimmed.length() > maxLength ? trimmed.substring(0, maxLength) + "..." : trimmed;
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }
}
